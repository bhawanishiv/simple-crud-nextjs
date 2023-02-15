import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';

import cx from 'classnames';
import moment from 'moment';
import {
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source';

import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';

import { CustomEventService } from '@/lib/event-source';

import SchemaWizard from './components/SchemaWizard';

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
        "relatedSchema" : "Company",
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

const getResultsXhr = ({
  payload,
  onMessage,
  onEnd,
  onError,
}: {
  payload: any;
  onMessage: (d?: any) => any;
  onEnd: (d?: any) => any;
  onError: (d?: any) => any;
}) => {
  return new Promise((resolve, reject) => {
    const se = new CustomEventService(OPENAPI_API_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${OPENAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    se.addEventListener('message', (msg: any) => {
      if (msg.data === '[DONE]') {
        onEnd(msg);
        se.close();

        resolve(se);
        return;
      }

      onMessage(msg);
    });

    se.addEventListener('error', (msg: any) => {
      onError(msg);
      se.close();
      reject();
    });

    se.stream();
  });
};

type PlaygroundPageProps = {};

const PlaygroundPage: React.FC<PlaygroundPageProps> = (props) => {
  const {} = props;

  const router = useRouter();
  const ctrlRef = useRef<any>(null);

  const [count, setCount] = useState<number>(-1);
  const [queries, setQueries] = useState<any[]>([]);
  const [choices, setChoices] = useState<any[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [currentChoiceIndex, setCurrentChoiceIndex] = useState<number>(-1);
  const { formState, register, handleSubmit } = useForm({});

  const { isSubmitting } = formState;

  const handleNavigateToSchemasPage = () => {
    router.push('/schemas');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleRunSchemaWizard = (choice: any, index: number) => () => {
    setCurrentChoiceIndex(index);
  };

  const handleSchemaWizardClose = () => {
    setCurrentChoiceIndex(-1);
  };

  const handleSchemaWizardSuccess = () => {
    setSnackbarOpen(true);
    setCurrentChoiceIndex(-1);
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

      await getResultsXhr({
        payload,
        onEnd: () => {
          setChoices((prevChoices) => {
            let newChoices = [...prevChoices];
            newChoices[newCount] = {
              ...newChoices[newCount],
              completed: true,
            };
            return newChoices;
          });
        },
        onError: () => {
          setChoices((prevChoices) => {
            let newChoices = [...prevChoices];
            newChoices[newCount] = {
              ...newChoices[newCount],
              failed: true,
            };
            return newChoices;
          });
        },
        onMessage: (msg: any) => {
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
        },
      });
    } catch (e) {
      console.log(`e->`, e);
    }
  };

  const renderPlaygroundPage = () => {
    return (
      <>
        <Snackbar
          open={snackbarOpen}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message="Schema and fields created successfully"
        />
        <div className="h-screen w-screen overflow-hidden flex flex-col">
          <div className="py-2 px-6 flex items-center gap-3">
            <div>
              <Typography className="text-lg" component={'h1'}>
                Schema Playground
              </Typography>
            </div>
            <div>
              <Button onClick={handleNavigateToSchemasPage}>
                View schemas
              </Button>
            </div>
          </div>
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
