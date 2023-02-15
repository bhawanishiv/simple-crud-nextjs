import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';

import cx from 'classnames';
import moment from 'moment';
import {
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source';

import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';

import { CustomEventSource } from '@/lib/event-source';

import SchemaWizard from './components/SchemaWizard';

// class RetriableError extends Error {}
// class FatalError extends Error {}

const OPENAPI_API_KEY = process.env.NEXT_PUBLIC_OPENAPI_API_KEY;

const OPENAPI_API_ENDPOINT = 'https://api.openai.com/v1/completions';

const INPUT_MODEL = `
generate a schema to track software bugs.
{
  "schema":{
    "name" : "Bug",
    "title" : "Bug"    
  },
  "fields": [
    {
        "name" : "title",
        "title" : "Title",
        "type"  : "text",
        "required" : true
    },
    {
        "name" : "description",
        "title" : "Description",
        "type" : "multi-text"        
    },
    {
        "name" : "completed",
        "title" : "Completed",
        "type" : "boolean"        
    },
    {
        "name" : "reportedAt",
        "title" : "Reported at",
        "type" : "date"        
    },
    {
        "name" : "priority",
        "title" : "Priority",
        "type"  : "list",
        "required" : true,
        "options" : ["High","Medium","Low"],
        "defaultValue" : "Medium"
    },
    {
        "name" : "companiesEnvolved",
        "title" : "Companies Envolved",
        "type" : "related",
        "relationSchema" : "Company",
        "relationType" : "hasMany"
    }
  ]
}
`;

//REST method for printing results
// const getResults = async ({ text }: { text: string }) => {
//   const payload = {
//     model: 'text-davinci-003',
//     temperature: 0,
//     max_tokens: 1000,
//     prompt: `${INPUT_MODEL}
//     ${text}
//     `,
//   };

//   const body = JSON.stringify(payload);

//   const res = await fetch(OPENAPI_API_ENDPOINT, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${OPENAPI_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body,
//   });
//   if (!res.ok) throw new Error();
//   const data = await res.json();
//   return data;
// };

type PlaygroundPageProps = {};

const PlaygroundPage: React.FC<PlaygroundPageProps> = (props) => {
  const {} = props;

  const router = useRouter();
  const ctrlRef = useRef<any>(null);
  const containerRef = useRef<any>(null);

  const [count, setCount] = useState<number>(-1);
  const [queries, setQueries] = useState<any[]>([]);
  const [choices, setChoices] = useState<any[]>([]);
  const [succeeded, setSucceeded] = useState<(null | boolean)[]>([]);
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState<number>(-1);
  const { formState, watch, reset, register, handleSubmit } = useForm({});

  const { isSubmitting } = formState;

  const handleRunSchemaWizard = (choice: any, index: number) => () => {
    setCurrentChoiceIndex(index);
  };

  const handleSchemaWizardClose = () => {
    setCurrentChoiceIndex(-1);
  };

  const handleSchemaWizardSuccess = () => {
    // setCurrentChoiceIndex(-1);
  };

  const handlePlaygroundInputSubmit = async (values: any) => {
    try {
      const now = moment();
      const payload = {
        model: 'text-davinci-003',
        stream: true,
        temperature: 0,
        max_tokens: 1000,
        prompt: `${INPUT_MODEL}
        ${values.text}
        `,
      };
      let newCount = count + 1;
      setCount(newCount);

      const se = new CustomEventSource(OPENAPI_API_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${OPENAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        payload: JSON.stringify(payload),
      });

      se.addEventListener('message', (msg: any) => {
        if (msg.data === '[DONE]') {
          setChoices((prevChoices) => {
            let newChoices = [...prevChoices];
            newChoices[newCount] = {
              ...newChoices[newCount],
              completed: true,
            };
            return newChoices;
          });
          return;
        }

        const { choices: resChoices } = JSON.parse(msg.data);

        if (resChoices.length) {
          const text = resChoices[0].text;
          setChoices((prevChoices) => {
            let newChoices = [...prevChoices];
            if (!newChoices[newCount]) {
              newChoices[newCount] = {
                prompt: values.text,
                data: [text],
                text,
                createdAt: now.format('LLL'),
              };
            } else {
              const newText = newChoices[newCount].text + text;
              newChoices[newCount] = {
                ...newChoices[newCount],
                data: [...newChoices[newCount].data, text],
                text: newText,
              };
            }
            return newChoices;
          });
        }
      });

      se.addEventListener('error', (msg: any) => {
        setChoices((prevChoices) => {
          let newChoices = [...prevChoices];
          newChoices[newCount] = {
            ...newChoices[newCount],
            failed: true,
          };
          return newChoices;
        });
        se.close();
      });

      se.addEventListener('done', (msg: any) => {
        se.close();
      });

      console.log(`se->`, se);

      se.stream();

      // await fetchEventSource(OPENAPI_API_ENDPOINT, {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${OPENAPI_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   signal: ctrlRef.current?.signal,
      //   body: JSON.stringify(payload),
      //   async onopen(response) {
      //     if (
      //       response.ok &&
      //       response.headers.get('content-type') === EventStreamContentType
      //     ) {
      //       return; // everything's good
      //     } else if (
      //       response.status >= 400 &&
      //       response.status < 500 &&
      //       response.status !== 429
      //     ) {
      //       // client-side errors are usually non-retriable:
      //       throw new FatalError();
      //     } else {
      //       throw new RetriableError();
      //     }
      //   },
      //   onmessage(msg) {
      //     // if the server emits an error message, throw an exception
      //     // so it gets handled by the onerror callback below:
      //     if (msg.event === 'FatalError') {
      //       throw new FatalError(msg.data);
      //     }

      //     if (msg.data === '[DONE]') {
      //       setChoices((prevChoices) => {
      //         let newChoices = [...prevChoices];
      //         newChoices[newCount] = {
      //           ...newChoices[newCount],
      //           completed: true,
      //         };
      //         return newChoices;
      //       });
      //       return;
      //     }

      //     const { choices: resChoices } = JSON.parse(msg.data);

      //     if (resChoices.length) {
      //       const text = resChoices[0].text;
      //       setChoices((prevChoices) => {
      //         let newChoices = [...prevChoices];
      //         if (!newChoices[newCount]) {
      //           newChoices[newCount] = {
      //             prompt: values.text,
      //             data: [text],
      //             text,
      //             createdAt: now.format('LLL'),
      //           };
      //         } else {
      //           const newText = newChoices[newCount].text + text;
      //           newChoices[newCount] = {
      //             ...newChoices[newCount],
      //             data: [...newChoices[newCount].data, text],
      //             text: newText,
      //           };
      //         }
      //         return newChoices;
      //       });
      //     }
      //   },

      //   onclose() {
      //     // if the server closes the connection unexpectedly, retry:
      //     // throw new RetriableError();
      //     setChoices((prevChoices) => {
      //       let newChoices = [...prevChoices];
      //       newChoices[newCount] = {
      //         ...newChoices[newCount],
      //         completed: true,
      //       };
      //       return newChoices;
      //     });

      //     throw new RetriableError();
      //   },
      //   onerror(err) {
      //     if (err instanceof FatalError) {
      //       setChoices((prevChoices) => {
      //         let newChoices = [...prevChoices];
      //         if (!newChoices[newCount]) {
      //           newChoices[newCount] = {
      //             ...newChoices[newCount],
      //             prompt: values.text,
      //             failed: true,
      //           };
      //         }
      //         return newChoices;
      //       });
      //       throw err; // rethrow to stop the operation
      //     } else {
      //       // do nothing to automatically retry. You can also
      //       // return a specific retry interval here.
      //       // throw err; // rethrow to stop the operation
      //       setChoices((prevChoices) => {
      //         let newChoices = [...prevChoices];
      //         if (!newChoices[newCount]) {
      //           newChoices[newCount] = {
      //             ...newChoices[newCount],
      //             prompt: values.text,
      //             failed: true,
      //             completed: true,
      //           };
      //         }
      //         return newChoices;
      //       });
      //     }
      //     throw err;
      //   },
      // });
      // const res = await getResults(values);

      // if (res.choices && res.choices.length) {
      //   setQueries([
      //     ...queries,
      //     { text: values.text, createdAt: now.format('LLL') },
      //   ]);
      //   const [choice] = res.choices;
      //   console.log(`choice->`, choice);
      //   const json = JSON.parse(choice.text);
      //   console.log(`json->`, json);
      //   setChoices((prevResponses) => [...prevResponses, ...res.choices]);
      //   reset({ text: '' });
      // }
    } catch (e) {
      console.log(`e->`, e);
    }
  };

  const renderPlaygroundPage = () => {
    return (
      <>
        <div className="h-screen w-screen overflow-hidden flex flex-col">
          <div className="flex flex-col-reverse flex-1 overflow-y-auto">
            <ul className="p-6">
              {choices
                .filter((x) => x)
                .map((choice, i) => {
                  return (
                    <li key={i} className="p-2 whitespace-pre">
                      <div>
                        <Typography
                          component={'h3'}
                          className={'text-xl font-body'}
                        >
                          {choice.prompt}
                        </Typography>
                        <Typography className="text-sm">
                          {choice.createdAt}
                        </Typography>
                        <div>
                          {choice.data?.map((value: string, j: number) => {
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
                        </div>
                        {choice.completed && (
                          <div className="flex">
                            <div className="flex items-center gap-3 rounded-full py-2 px-4 border border-gray">
                              <div>
                                <Typography className="text-md">
                                  Execute this statement
                                </Typography>
                                <Typography className="text-sm">
                                  {choice.prompt}
                                </Typography>
                              </div>
                              <div>
                                <IconButton
                                  onClick={handleRunSchemaWizard(choice, i)}
                                >
                                  <ArrowForwardOutlinedIcon />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
          <form onSubmit={handleSubmit(handlePlaygroundInputSubmit)}>
            <div className="px-6 py-4">
              <div className="flex items-center rounded-full border border-gray overflow-hidden">
                <input
                  placeholder="e.g. Create a schema to manage Customers"
                  className="py-4 px-4 w-full bg-transparent outline-none"
                  {...register('text', { required: 'true' })}
                />
                <div className="px-2">
                  <IconButton
                    disabled={isSubmitting}
                    color="primary"
                    type="submit"
                  >
                    {isSubmitting ? (
                      <CircularProgress size={16} />
                    ) : (
                      <SendOutlinedIcon />
                    )}
                  </IconButton>
                </div>
              </div>
            </div>
          </form>
        </div>
        <SchemaWizard
          open={currentChoiceIndex > -1}
          text={choices[currentChoiceIndex]?.text}
          onClose={handleSchemaWizardClose}
          onSuccess={handleSchemaWizardSuccess}
        />
      </>
    );
  };

  useEffect(() => {
    ctrlRef.current = new AbortController();
    return () => {
      ctrlRef.current?.abort();
    };
  }, []);

  return renderPlaygroundPage();
};

export default PlaygroundPage;
