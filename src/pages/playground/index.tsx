import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';

import dayjs from 'dayjs';

import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';

import { BASE_INPUT_MODEL_PROMPT_JSON } from '@/lib/constants';
import { getGPTResponseSSE, schemaFinder } from '@/lib/utils';

import SchemaWizard from './components/SchemaWizard';

const PlaygroundPage = () => {
  const router = useRouter();

  const [withContext, setWithContext] = useState(true);

  const [count, setCount] = useState<number>(-1);
  const [choices, setChoices] = useState<any[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingIndices, setPendingIndices] = useState<number[]>([]);

  const [currentChoiceIndex, setCurrentChoiceIndex] = useState<number>(-1);
  const { formState, register, handleSubmit } = useForm({});

  const { isSubmitting } = formState;

  const handleNavigateToSchemasPage = () => {
    router.push('/schemas');
  };

  const handleChangeResponseContext = (event: any) => {
    setWithContext(event.target.checked);
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

  const playgroundResponseHandlers = async ({
    query,
    prompt,
    index,
  }: {
    index: number;
    query: string;
    prompt: string;
  }) => {
    try {
      setLoading(true);
      const payload = {
        model: 'text-davinci-003',
        stream: true,
        temperature: 0,
        max_tokens: 256,
        prompt,
      };

      await getGPTResponseSSE({
        payload,
        onEnd: async () => {
          setPendingIndices((indices) => [...indices, index]);
        },
        onError: () => {
          setChoices((prevChoices) => {
            const newChoices = [...prevChoices];
            newChoices[index] = {
              ...newChoices[index],
              failed: true,
            };
            return newChoices;
          });
          setLoading(false);
        },
        onMessage: (msg: any) => {
          const { choices: resChoices } = JSON.parse(msg.data);

          if (resChoices.length) {
            const text = resChoices[0].text;
            setChoices((prevChoices) => {
              const newChoices = [...prevChoices];
              if (!newChoices[index]) {
                const now = dayjs();

                newChoices[index] = {
                  query,
                  data: [text],
                  text,
                  createdAt: now.format('LLL'),
                };
              } else {
                const newText = newChoices[index].text + text;
                newChoices[index] = {
                  ...newChoices[index],
                  data: [...newChoices[index].data, text],
                  text: newText,
                };
              }
              return newChoices;
            });
          }
        },
      });
    } catch (e) {
      setLoading(false);
    }
  };

  const fetchPendingResponse = async ({
    lastEndIndex,
  }: {
    lastEndIndex: number;
  }) => {
    let responseCompleted = false;
    let completed = true;
    try {
      schemaFinder(choices[lastEndIndex].text.trim());
      responseCompleted = true;
      setLoading(false);
    } catch (e) {
      // throw new Error('');
      completed = false;
    } finally {
      setChoices((prevChoices) => {
        const newChoices = [...prevChoices];
        newChoices[lastEndIndex] = {
          ...newChoices[lastEndIndex],
          pending: !responseCompleted,
          completed,
        };
        return newChoices;
      });
      if (!responseCompleted) {
        const prompts = [BASE_INPUT_MODEL_PROMPT_JSON];

        if (withContext) {
          for (const choice of choices) {
            prompts.push(choice.query);
            prompts.push(choice.text);
          }
        }

        const { text, query } = choices[lastEndIndex];

        prompts.push(query);
        prompts.push(text);

        // const newPrompt = `${BASE_INPUT_MODEL_PROMPT_JSON}
        // ${query}
        // ${text}`;

        await playgroundResponseHandlers({
          query,
          prompt: prompts.join('\n'),
          index: lastEndIndex,
        });
      }
    }
  };

  const handlePlaygroundInputSubmit = async (values: any) => {
    try {
      const newCount = count + 1;
      setCount(newCount);

      const prompts = [BASE_INPUT_MODEL_PROMPT_JSON];

      if (withContext) {
        for (const choice of choices) {
          prompts.push(choice.query);
          prompts.push(choice.text);
        }
      }

      prompts.push(values.text);

      await playgroundResponseHandlers({
        query: values.text,
        index: newCount,
        prompt: prompts.join('\n'),
      });
    } catch (e) {
      // console.log(`e->`, e);
    }
  };

  const renderAction = (choice: any, index: number) => {
    if (loading || choice.failed) return null;

    // if (choice.pending) {
    //   return (
    //     <div className="flex">
    //       <div className="flex items-center gap-3 rounded-full py-2 px-4 border border-gray">
    //         <Typography className="text-md">See more</Typography>
    //         <Typography className="text-xs">
    //           Click to see more response for this query
    //         </Typography>
    //         <div>
    //           <IconButton onClick={handleContinueResponse(choice, index)}>
    //             <ArrowForwardOutlinedIcon />
    //           </IconButton>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }
    if (choice.completed) {
      return (
        <div className="flex">
          <div className="flex items-center gap-3 rounded-full py-2 px-4 border border-gray">
            <div>
              <Typography className="text-md">
                Execute this statement
              </Typography>
              <Typography className="text-sm">{choice.query}</Typography>
            </div>
            <div>
              <IconButton onClick={handleRunSchemaWizard(choice, index)}>
                <ArrowForwardOutlinedIcon />
              </IconButton>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
                          {choice.query}
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
                        {renderAction(choice, i)}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
          <form onSubmit={handleSubmit(handlePlaygroundInputSubmit)}>
            <div className="px-6 py-4">
              <FormControlLabel
                disabled={isSubmitting || loading}
                checked={withContext}
                onChange={handleChangeResponseContext}
                control={<Checkbox />}
                label="Query on previous responses"
              />
              <div className="flex items-center rounded-full border border-gray overflow-hidden">
                <input
                  placeholder="e.g. Create a schema to manage Customers"
                  className="py-4 px-4 w-full bg-transparent outline-none"
                  {...register('text', { required: 'true' })}
                />
                <div className="px-2">
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
    if (!pendingIndices.length) return;
    const lastEndIndex = pendingIndices[pendingIndices.length - 1];
    if (lastEndIndex > -1) {
      fetchPendingResponse({ lastEndIndex });
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIndices]);

  return renderPlaygroundPage();
};

export default PlaygroundPage;
