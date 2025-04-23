import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source';
import z, { ZodError } from 'zod';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import _ from 'lodash';
import jsYml from 'js-yaml';

import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';

import { OPERATION_GPT_TEXT_YAML } from '@/lib/constants';
import { getGPTResponseSSE, schemaFinder } from '@/lib/utils';
import { fieldTypes } from '@/interfaces/DynamicSchema';

import api from '@/services/api';

import {
  FieldTypeEnum,
  IDynamicSchema,
  IDynamicSchemaField,
  RelatedTypeEnum,
} from '@/interfaces/DynamicSchema';
import { OPENAI_COMPLETION_API_ENDPOINT } from '@/lib/urls';
import {
  CreateOperationRequest,
  OperationRequest,
  SearchOperationRequest,
  UpdateOperationRequest,
} from '@/interfaces/operation';

const schemaFields = ['name', 'title'];
const fieldFields = [
  'name',
  'title',
  'type',
  'required',
  'unique',
  'default',
  'options',
  'relatedSchema',
  'relationType',
];

const updateOperation = async (schema: IDynamicSchema, payload: any) => {
  const res = await api.request(
    `/api/schemas/${schema.id}/update`,
    'POST',
    payload
  );

  const data = await res.json();
  return data;
};

const getPromptPreText = () => {
  return jsYml.dump({
    fieldTypes,
    relationTypes: ['hasOne', 'hasMany'],
    fields: fieldFields,
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

type GPTResponse = {
  createdAt: string;
  type: 'OPERATION' | 'CREATE';
  data: string[];
  text: string;
  completed?: boolean;
  pending?: boolean;
  query: string;
  prompt?: string;
  finishReason?: string;
};

const initialValues: GPTResponse = {
  type: 'OPERATION',
  createdAt: '',
  data: [],
  text: '',
  query: '',
  finishReason: '',
};

type DataChatProps = {
  schema: IDynamicSchema;
  fields: IDynamicSchemaField[];
  onComplete: () => void;
  onSearch: (params: any) => void;
  onUpdateSuccess: () => void;
};

const DataChat: React.FC<DataChatProps> = (props) => {
  const { schema, fields, onSearch, onComplete, onUpdateSuccess } = props;
  const abortControllerRef = useRef(new AbortController());

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GPTResponse>(initialValues);

  const [refSchemas, setRefSchemas] = useState<any[]>([]);
  const [triggerNext, setTriggerNext] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const baseModel = useMemo(() => {
    // const preText = getPromptPreText();
    if (fields.length > 3) {
      const localBaseModel = jsYml.dump(
        {
          schema: _.pick(schema, schemaFields),
          fields: fields.map((field) => _.pick(field, fieldFields)),
        },
        {}
      );

      return (
        // preText +
        '\n\n' +
        'generate a schema to track ' +
        schema.name +
        '\n\n' +
        localBaseModel
      );
    }

    return '';

    // return preText + '\n' + BASE_INPUT_MODEL_PROMPT_YAML;
  }, [schema, fields]);

  const { formState, register, watch, handleSubmit } = useForm({});

  const { isSubmitting } = formState;

  const closePanel = () => {
    setResponse(initialValues);
    setLoading(false);
    abortControllerRef.current?.abort();
  };

  const fetchSchemaDetails = async ({
    fields,
  }: {
    fields: IDynamicSchemaField[];
  }) => {
    const promises = [];

    for (let field of fields.filter((f) => f.type === 'related')) {
      promises.push(
        api.request(`/api/schemas/${field.relatedSchema}/fields`, 'GET', {})
      );
    }

    const res = await Promise.all(promises);
    const data = [];

    for (let i = 0; i < res.length; i++) {
      data.push(await res[i].json());
    }

    let parsed = data.map((d) => ({
      schema: _.pick(d.schema, schemaFields),
      fields: d.fields.map((f: any) => _.pick(f, fieldFields)),
    }));

    setRefSchemas(parsed);

    return parsed;
  };

  const playgroundResponseHandlers = async ({ prompt }: { prompt: string }) => {
    try {
      setLoading(true);

      const payload = {
        model: 'text-davinci-003',
        stream: true,
        temperature: 0,
        max_tokens: 128,
        prompt,
      };

      await fetchEventSource(OPENAI_COMPLETION_API_ENDPOINT, {
        signal: abortControllerRef.current.signal,
        headers: {
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
                const now = dayjs();
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
    } catch (e) {
      setLoading(false);
    }
  };

  const preparePrompt = (query: string, refSchemas: any[] = []) => {
    const obj = {
      schemaDetails: {
        currentSchema: {
          schema: _.pick(schema, schemaFields),
          fields: fields.map((f: any) => _.pick(f, fieldFields)),
        },
        referencedSchemaItems: refSchemas,
      },
    };

    const ymlString = jsYml.dump(obj, {
      quotingType: '"',
      forceQuotes: true,
    });

    return (
      '### Process different mongoose schemas and their fields, and response based on these input.\n' +
      ymlString +
      '\n' +
      'Note: response should be in yaml format.\n' +
      `statement: ${query}`
    );
  };

  const getOperationPrompt = (query: string) => {
    const schemaYamlStr = jsYml.dump(
      {
        schema: _.pick(schema, schemaFields),
        fields: fields.map((f: any) => _.pick(f, fieldFields)),
      },
      {
        quotingType: '"',
        forceQuotes: true,
      }
    );
    const prompt =
      'Detect the type of operation being requested\n\n' +
      schemaYamlStr +
      '\n' +
      OPERATION_GPT_TEXT_YAML +
      '\n' +
      query;

    return prompt;
  };

  const handleInputSubmit = async (values: any) => {
    try {
      setErrorMessage('');
      setResponse(initialValues);

      const prompt = getOperationPrompt(values.text);

      setResponse((r) => ({ ...r, query: values.text, prompt }));
      await playgroundResponseHandlers({
        prompt,
      });
    } catch (e) {
      //
    }
  };

  const getFieldSchema = (field: IDynamicSchemaField) => {
    switch (field.type) {
      case 'text':
      case 'multi-text':
      case 'list': {
        if (!field.required) {
          return z.string().trim().optional();
        }
        return z.string().trim();
      }
      case 'related': {
        let schema;
        if (field.relationType === 'hasMany') {
          schema = z.array(z.string().trim());
        } else {
          schema = z.string().trim().nullable();
        }

        if (!field.required) {
          return schema.optional();
        }
      }
      default:
        return z.any();
    }
  };

  const prepareSchema = (fields: IDynamicSchemaField[]) => {
    const schemaObj: { [key: string]: any } = {};

    for (let field of fields) {
      schemaObj[field.name] = getFieldSchema(field);
    }

    return z.array(z.object(schemaObj));
  };

  const handleRunCreateOnSchema = async () => {
    try {
      setLoading(true);

      let parsedSchema: any = jsYml.load(response.text.trim());

      const ZodSchema = prepareSchema(fields);

      let data: any = [];
      if (parsedSchema.response) {
        data = parsedSchema.response;
      } else if (parsedSchema.dummyData) {
        data = parsedSchema.dummyData;
      } else if (parsedSchema.data) {
        data = parsedSchema.data;
      } else {
        data = parsedSchema;
      }

      const parsedItems = ZodSchema.parse(data);

      const res = await api.request(
        `/api/schemas/${schema.id}/items`,
        'POST',
        parsedItems
      );

      const resData = await res.json();

      if (!res.ok) throw new Error(resData?.message);

      if (!resData) throw new Error();

      onComplete();
    } catch (e: any) {
      if (e instanceof ZodError) {
        setErrorMessage(e.errors[0].message);
      } else setErrorMessage(e.message || 'Something is wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCreateResponse = async (
    req: CreateOperationRequest,
    query: string
  ) => {
    try {
      setLoading(true);

      const refSchemas = await fetchSchemaDetails({ fields });
      const prompt = preparePrompt(query, refSchemas);

      setResponse({
        ...initialValues,
        createdAt: new Date().toISOString(),
        query,
        prompt,
        type: 'CREATE',
      });

      await playgroundResponseHandlers({
        prompt,
      });
    } catch (e: any) {
      if (e instanceof ZodError) {
        setErrorMessage(e.errors[0].message);
      } else setErrorMessage(e.message || 'Something is wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSearchResponse = (req: SearchOperationRequest) => {
    onSearch(req.params);
  };

  const handleExecuteUpdateResponse = async (req: UpdateOperationRequest) => {
    const payload = {
      ...req.params,
      ...req,
    };

    await updateOperation(schema, payload);
    onUpdateSuccess();
  };

  const handleExecuteResponse = async () => {
    try {
      setLoading(true);
      let parsedSchema: any = jsYml.load(response.text.trim());

      if (!parsedSchema.response) {
        throw new Error('No valid response found');
      }

      const { type } = parsedSchema.response as OperationRequest;

      switch (type as string) {
        case 'READ':
        case 'FIND':
        case 'SEARCH': {
          await handleExecuteSearchResponse(parsedSchema.response);
          break;
        }

        case 'CREATE':
        case 'ADD': {
          await handleExecuteCreateResponse(
            parsedSchema.response,
            response.query
          );
          break;
        }

        case 'UPDATE':
        case 'CHANGE':
        case 'MODIFY': {
          await handleExecuteUpdateResponse(parsedSchema.response);
          break;
        }

        default: {
          throw new Error('Invalid operation type');
          break;
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Something is wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingResponse = async () => {
    try {
      setErrorMessage('');

      if (response.finishReason == 'length') {
        let prompts = [response.prompt, response.text];
        setResponse((prevResponse) => {
          prevResponse.pending = true;
          return prevResponse;
        });

        await playgroundResponseHandlers({
          prompt: prompts.join('\n'),
        });
      } else {
        setResponse((prevResponse) => {
          const newResponse = { ...prevResponse };
          newResponse.pending = false;
          newResponse.completed = true;
          return newResponse;
        });

        if (response.type === 'OPERATION') await handleExecuteResponse();
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const renderAction = () => {
    if (response.completed && response.type === 'CREATE') {
      return (
        <IconButton onClick={handleRunCreateOnSchema}>
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

  const renderDataChat = () => {
    return (
      <div
        className={cn(
          'relative flex flex-col w-full',
          response.text && 'bg-background-light rounded-t-xl'
        )}
      >
        <form className="w-full" onSubmit={handleSubmit(handleInputSubmit)}>
          <div
            className={cn(
              'flex items-center w-full overflow-hidden rounded-full',
              response.text ? '' : 'border border-gray'
            )}
          >
            <input
              placeholder={`Search, add or update in ${schema.title} schema`}
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

  return renderDataChat();
};

export default DataChat;
