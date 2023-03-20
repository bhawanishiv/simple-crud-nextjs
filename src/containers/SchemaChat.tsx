import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source';
import z, { ZodError } from 'zod';
import cx from 'classnames';
import moment from 'moment';
import _ from 'lodash';
import jsYml from 'js-yaml';

import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';

import {
  BASE_INPUT_MODEL_PROMPT_JSON,
  BASE_INPUT_MODEL_PROMPT_YAML,
  OPENAPI_API_KEY,
} from '@/lib/constants';
import { getGPTResponseSSE, schemaFinder } from '@/lib/utils';
import { fieldTypes } from '@/interfaces/DynamicSchema';

import api from '@/services/api';

import {
  FieldTypeEnum,
  IDynamicSchema,
  IDynamicSchemaField,
  RelatedTypeEnum,
} from '@/interfaces/DynamicSchema';
import { OPENAPI_API_ENDPOINT } from '@/lib/urls';

const getPromptPreText = () => {
  return jsYml.dump({
    fieldTypes,
    relationTypes: ['hasOne', 'hasMany'],
    fields: [
      'name',
      'title',
      'type',
      'required',
      'unique',
      'default',
      'options',
      'relatedSchema',
      'relationType',
    ],
  });
};

const SchemaWizardSchema = z.object({
  schema: z.object({
    title: z.string().trim(),
    name: z
      .string()
      .trim()
      .transform((v) => _.capitalize(_.camelCase(v))),
  }),
  fields: z.array(
    z.object({
      title: z.string().trim(),
      name: z.string().trim().optional().transform(_.camelCase),
      type: FieldTypeEnum,
      unique: z.boolean().optional(),
      required: z.boolean().optional(),
      relatedSchema: z.string().trim().optional(),
      relationType: RelatedTypeEnum.optional(),
      options: z.array(z.string().trim()).optional(),
      default: z
        .union([
          z.string().trim(),
          z.null(),
          z.boolean(),
          z.number(),
          z.array(z.string().trim()),
        ])
        .optional(),
    })
  ),
});

const initialValues = {
  createdAt: '',
  data: [],
  text: '',
  query: '',
  finishReason: '',
};

type GPTChatProps = {
  schema: IDynamicSchema;
  fields: IDynamicSchemaField[];
  onUpdate: () => void;
};

const GPTChat: React.FC<GPTChatProps> = (props) => {
  const { schema, fields, onUpdate } = props;
  const abortControllerRef = useRef(new AbortController());

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    createdAt: string;
    data: string[];
    text: string;
    completed?: boolean;
    pending?: boolean;
    query: string;
    finishReason?: string;
  }>(initialValues);
  const [triggerNext, setTriggerNext] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const baseModel = useMemo(() => {
    const preText = getPromptPreText();
    if (fields.length > 3) {
      const localBaseModel = jsYml.dump(
        {
          schema: {
            name: schema.name,
            title: schema.title,
          },
          fields: fields.map((field) =>
            _.pick(field, [
              'title',
              'name',
              'type',
              'required',
              'unique',
              'relatedSchema',
              'relationType',
              'options',
              'default',
            ])
          ),
        },
        {}
      );

      return (
        preText +
        '\n\n' +
        'generate a schema to track ' +
        schema.name +
        '\n\n' +
        localBaseModel
      );
    }

    return preText + '\n' + BASE_INPUT_MODEL_PROMPT_YAML;
  }, [schema, fields]);

  const { formState, register, watch, handleSubmit } = useForm({});

  const { isSubmitting } = formState;

  const closePanel = () => {
    setResponse(initialValues);
    setLoading(false);
    abortControllerRef.current?.abort();
  };

  const playgroundResponseHandlers = async ({
    query,
    prompt,
  }: {
    query: string;
    prompt: string;
  }) => {
    try {
      setLoading(true);

      const payload = {
        model: 'text-davinci-003',
        stream: true,
        temperature: 0,
        max_tokens: 128,
        prompt,
      };

      await fetchEventSource(OPENAPI_API_ENDPOINT, {
        signal: abortControllerRef.current.signal,
        headers: {
          Authorization: `Bearer ${OPENAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(payload),
        async onopen(response) {
          if (
            response.ok &&
            response.headers.get('content-type') === EventStreamContentType
          ) {
            return; // everything's good
          } else if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            // client-side errors are usually non-retriable:
            // throw new FatalError();
          } else {
            // throw new RetriableError();
          }
        },
        onmessage(msg) {
          if (msg.data === '[DONE]') {
            setTriggerNext((t) => t + 1);
            return;
          }
          const { choices: resChoices } = JSON.parse(msg.data);

          if (resChoices.length) {
            const text = resChoices[0].text as string;
            const finishReason = resChoices[0].finish_reason as string;

            setResponse((prevResponse) => {
              const newResponse = { ...prevResponse };
              // return { ...prevResponse, failed: true };
              if (!newResponse.data.length) {
                const now = moment();
                newResponse.createdAt = now.format('LLL');
                newResponse.data = [text];
              } else {
                newResponse.text = newResponse.text + text;
                newResponse.data = [...newResponse.data, text];
              }

              newResponse.finishReason = finishReason;
              return newResponse;
            });

            // if(finishReason==='length'){

            // }
          }

          // if the server emits an error message, throw an exception
          // so it gets handled by the onerror callback below:
          if (msg.event === 'FatalError') {
            // throw new FatalError(msg.data);
          }
        },
        onclose() {
          // if the server closes the connection unexpectedly, retry:
          // throw new RetriableError();
        },
        onerror(err) {
          // if (err instanceof FatalError) {
          //   throw err; // rethrow to stop the operation
          // } else {
          //   // do nothing to automatically retry. You can also
          //   // return a specific retry interval here.
          // }
        },
      });

      // await getGPTResponseSSE({
      //   payload,
      //   signal: abortControllerRef.current?.signal,
      //   onEnd: async () => {
      //     setResponse((prevResponse) => {
      //       const newResponse = { ...prevResponse };
      //       newResponse.data.push(newStreamData);
      //       return newResponse;
      //     });
      //     setTriggerNext((t) => t + 1);
      //   },
      //   onError: () => {
      //     setResponse((prevResponse) => {
      //       return { ...prevResponse, failed: true };
      //     });
      //   },
      //   onMessage: (msg: any) => {
      //     const { choices: resChoices } = JSON.parse(msg.data);

      //     if (resChoices.length) {
      //       const text = resChoices[0].text as string;

      //       setResponse((prevResponse) => {
      //         const newResponse = { ...prevResponse };
      //         // return { ...prevResponse, failed: true };
      //         if (!newResponse.data.length) {
      //           const now = moment();
      //           newResponse.createdAt = now.format('LLL');
      //           newResponse.data = [[text]];
      //         } else {
      //           newResponse.text = newResponse.text + text;
      //           newStreamData.push(text);
      //         }

      //         return newResponse;
      //       });
      //     }
      //   },
      // });
    } catch (e) {
      setLoading(false);
    }
  };

  const handlePlaygroundInputSubmit = async (values: any) => {
    try {
      setErrorMessage('');
      setResponse(initialValues);

      await playgroundResponseHandlers({
        query: values.text,
        prompt: [baseModel, values.text].join('\n'),
      });
    } catch (e) {
      //
    }
  };

  // const fetchPendingResponse = async () => {
  //   let responseCompleted = false;
  //   let completed = true;
  //   try {
  //     setErrorMessage('');
  //     schemaFinder(response.text.trim());
  //     responseCompleted = true;
  //     setLoading(false);
  //   } catch (e) {
  //     // throw new Error('');
  //     completed = false;
  //   } finally {
  //     setResponse((prevResponse) => {
  //       prevResponse.pending = !responseCompleted;
  //       prevResponse.completed = completed;
  //       return prevResponse;
  //     });

  //     if (!responseCompleted) {
  //       let prompts = [baseModel, response.query, response.text];

  //       await playgroundResponseHandlers({
  //         query: response.query,
  //         prompt: prompts.join('\n'),
  //       });
  //     }
  //   }
  // };

  const fetchPendingResponse = async () => {
    try {
      setErrorMessage('');

      if (response.finishReason == 'length') {
        let prompts = [baseModel, response.query, response.text];
        setResponse((prevResponse) => {
          prevResponse.pending = true;
          return prevResponse;
        });

        await playgroundResponseHandlers({
          query: response.query,
          prompt: prompts.join('\n'),
        });
      } else {
        setResponse((prevResponse) => {
          prevResponse.pending = false;
          prevResponse.completed = true;
          return prevResponse;
        });
        setLoading(false);
      }
    } catch (e) {
    } finally {
    }
  };

  const handleExecuteResponse = async () => {
    try {
      setLoading(true);
      let parsedSchema: any = jsYml.load(response.text.trim());

      if (Array.isArray(parsedSchema)) {
        parsedSchema = {
          schema: {
            name: schema.name,
            title: schema.title,
          },
          fields: parsedSchema,
        };
      }
      if (!parsedSchema.schema) {
        parsedSchema.schema = {
          name: schema.name,
          title: schema.title,
        };
      }

      const parsedObj = SchemaWizardSchema.parse(parsedSchema);

      const fieldsByName: { [key: string]: any } = {};
      for (let field of fields) {
        fieldsByName[field.name] = 1;
      }

      const payload: z.infer<typeof SchemaWizardSchema> = {
        schema: parsedObj.schema,
        fields: [],
      };

      const newFields = [];
      for (let field of parsedObj.fields) {
        if (fieldsByName[field.name]) {
          continue;
        }
        newFields.push(field);
      }

      payload.fields = newFields;

      const res = await api.request('/api/schemas/playground', 'POST', payload);

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message);

      if (!data) throw new Error();
      onUpdate();
    } catch (e: any) {
      if (e instanceof ZodError) {
        setErrorMessage(e.errors[0].message);
      } else setErrorMessage(e.message || 'Something is wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderAction = () => {
    if (response.completed) {
      return (
        <IconButton onClick={handleExecuteResponse}>
          {loading ? (
            <CircularProgress size={16} />
          ) : (
            <PlayCircleFilledWhiteOutlinedIcon />
          )}
        </IconButton>
      );
    }

    return (
      <IconButton
        disabled={isSubmitting || loading}
        color="primary"
        type="submit"
      >
        {isSubmitting || loading ? (
          <CircularProgress size={16} />
        ) : (
          <SendOutlinedIcon />
        )}
      </IconButton>
    );
  };

  const renderGPTChat = () => {
    return (
      <div
        className={cx(
          'relative flex flex-col w-full',
          response.text && 'bg-background-light rounded-t-xl'
        )}
      >
        <form
          className="w-full"
          onSubmit={handleSubmit(handlePlaygroundInputSubmit)}
        >
          <div
            className={cx(
              'flex items-center w-full overflow-hidden rounded-full',
              response.text ? '' : 'border border-gray'
            )}
          >
            <input
              placeholder={
                fields.length
                  ? `e.g. Add name, age, dateOfBirth etc. fields to ${schema.name} schema.`
                  : `e.g. Create a schema to manage ${schema.name}`
              }
              className="py-3 px-4 w-full bg-transparent outline-none"
              {...register('text', { required: 'true' })}
            />

            <div className="px-2">{renderAction()}</div>
          </div>
        </form>
        {response.text && (
          <div className="absolute left-0 top-12 w-full bg-background-light z-10 rounded-b-xl">
            <div className="px-3">
              <Typography className="text-sm pb-2" color="red">
                {errorMessage}
              </Typography>
            </div>
            <ul className="flex w-full overflow-y-auto max-h-[50vh] flex-col-reverse ">
              <li className="px-3 whitespace-pre text-on-background-light">
                {response.data?.map((value: string, j: number) => {
                  return (
                    <Typography
                      key={j}
                      component="span"
                      className="overflow-x-hidden animate-type text-sm"
                    >
                      {value}
                    </Typography>
                  );
                })}
              </li>
            </ul>
            <div className="flex justify-between w-full p-2">
              <div />
              <div className="flex items-center gap-2">
                <Button onClick={closePanel}>Close this</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (triggerNext > 0) {
      fetchPendingResponse();
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNext]);

  useEffect(() => {
    setResponse(initialValues);
  }, [schema, fields]);

  return renderGPTChat();
};

export default GPTChat;
