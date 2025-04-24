'use client';

import React, { useEffect, useState } from 'react';

import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import jsYml from 'js-yaml';

import _ from 'lodash';
import { TGoMindMapSchema, TNodeData } from '@/interfaces/ai';

import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import EastOutlinedIcon from '@mui/icons-material/EastOutlined';
import WestOutlinedIcon from '@mui/icons-material/WestOutlined';
import StopOutlinedIcon from '@mui/icons-material/StopOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import MindMap from '@/components/ui/MindMap';

import { MIND_MAP_PROMPT_HELPER } from '@/lib/constants';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { TAiRequestWithSchema } from '@/interfaces/ai';
import CustomIconButton from '@/components/ui/custom-icon-button';
import { mindMapSuggestionsOptions } from '@/queries/mind-map';
import { generateObjectAction } from '@/action/ai';
import MindMapNodeFetchDialog from '@/components/ui/mind-map-node-fetch.dioalog';
import LoadingText from '@/components/loading-text';
import { downloadJson } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';

// const scriptSrc = 'https://unpkg.com/jsmind@0.5/es6/jsmind.js';
const scriptSrc = 'https://unpkg.com/gojs@2.3.5/release/go.js';

// Function to generate a custom unique ID
function generateCustomId() {
  const timestamp = Date.now().toString();
  const alphanumeric =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < 8; i++) {
    randomString += alphanumeric.charAt(
      Math.floor(Math.random() * alphanumeric.length),
    );
  }
  return `${timestamp}-${randomString}`;
}

const LOCAL_STORAGE_KEY = 'mindMapData';

// type MindMapPageProps = {
// };

type TFormValues = {
  text: string;
};

const MindMapClientPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.['ids']?.at(0) || null;
  const suggestionsQuery = useSuspenseQuery(mindMapSuggestionsOptions);

  const [scriptLoaded, setScriptLoaded] = useState(false);

  const [rootData, setRootData] = useState<TGoMindMapSchema[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  const { formState, control, reset, handleSubmit } = useForm<TFormValues>({
    defaultValues: {
      text: '',
    },
  });

  const aiMutation = useMutation<
    TGoMindMapSchema | null,
    Error,
    TAiRequestWithSchema
  >({
    mutationKey: ['mind-map', 'generate', rootData.length],
    mutationFn: async (data) => {
      return await generateObjectAction<TGoMindMapSchema>(data);
    },
    onError(error) {
      setError(error.message);
    },
    onSuccess() {
      setError(null);
      setCurrentKey(null);
      reset({ text: '' });
    },
  });

  const { isSubmitting } = formState;

  console.log(`scriptLoaded->`, scriptLoaded);

  const onScriptLoad = () => {
    setScriptLoaded(true);
    console.log('load');
  };

  const handleResetState = () => {
    setRootData([]);
    removeMindMapData(id || '');
    setError(null);
    setCurrentKey(null);
    reset({ text: '' });
    router.push('/mind-map');
  };

  const handleNewMap = () => {
    setRootData([]);
    setError(null);
    setCurrentKey(null);
    reset({ text: '' });
    router.push('/mind-map');
  };

  const addRootData = (data: TGoMindMapSchema | null, id: string) => {
    if (!data) return;
    setRootData((d) => {
      const newData = [...d];
      const lastData = newData[newData.length - 1];
      newData.push({
        ...(newData.length
          ? {
              class: 'go.TreeModel',
            }
          : data),
        nodeDataArray: [
          ...(lastData ? lastData.nodeDataArray : []),
          ...(newData.length ? data.nodeDataArray : data.nodeDataArray),
        ],
      });

      // Retrieve existing data from local storage
      const existingData = getMindMapData();

      // Add the new entry
      existingData[id] = newData[newData.length - 1];

      // Save the updated data back to local storage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));

      return newData;
    });
  };

  const handleTriggerInitialQuery: SubmitHandler<TFormValues> = async (
    values,
  ) => {
    try {
      const response = await aiMutation.mutateAsync({
        system: MIND_MAP_PROMPT_HELPER.replace('{{placeholder}}', ''),
        prompt: values.text,
        stream: false,
        schema: 'mind-map',
      });

      if (response) {
        const newId = generateCustomId();
        addRootData(response, newId);

        // Generate a custom unique ID and push it into the route
        router.push(`/mind-map/${newId}`);
      }
    } catch (e) {
      console.log(`e->`, e);
    }
  };

  const removeMindMapData = (id: string) => {
    const existingData = getMindMapData();
    delete existingData[id];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));
  };

  const getMindMapData = (): Record<string, TGoMindMapSchema> => {
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    } catch (error) {
      console.log(`error->`, error);
      data = {};
    } finally {
      return data;
    }
  };

  const onLoadChildNodes = async (key: string) => {
    setCurrentKey(key);
  };

  const handleFetchChildNodes: SubmitHandler<{ text: string }> = async (
    values,
  ) => {
    try {
      const { nodeDataArray } = rootData[rootData.length - 1];
      const obj: Record<string, TNodeData> = {};
      let root: TNodeData | null = null;

      for (const item of nodeDataArray) {
        obj[item.key] = item;
        if (item.key === '0') {
          root = item;
        }
      }

      if (!currentKey || !obj[currentKey]) throw new Error();

      const text = `USER QUERY: "${values.text}"\n`;

      const systemPromptPlaceholder = `\nNOTE: "${obj[currentKey].text}" is sub mind map of "${root?.text}" mind map`;

      const parents: Partial<TNodeData>[] = [];

      let finalItem: TNodeData | undefined = obj[currentKey];

      while (Boolean(finalItem)) {
        console.log(`finalItem->`, finalItem);
        parents.push(
          _.pick(finalItem, ['key', 'text', 'parent', 'dir', 'brush', 'dir']),
        );
        finalItem = obj[finalItem.parent || ''];
      }

      const str = jsYml.dump({ parents, entireMap: nodeDataArray });
      const prompt = text + '\n\CURRENT_PARENTS:\n' + str + '\n\n';

      console.log(`prompt->`, prompt);

      const updatedSystemPrompt = MIND_MAP_PROMPT_HELPER.replace(
        '{{placeholder}}',
        systemPromptPlaceholder,
      );
      const response = await aiMutation.mutateAsync({
        system: updatedSystemPrompt,
        prompt: prompt,
        stream: false,
        schema: 'mind-map',
      });

      console.log(`new_datadata->`, response);

      if (response) {
        addRootData(response, id || '');
      }
      setCurrentKey(null);
    } catch (e) {
      console.log(`e->`, e);
    } finally {
      //
    }
  };

  const handleCancelAiMutation = () => {
    aiMutation.reset();
    setError(null);
    setCurrentKey(null);
    reset({ text: '' });
  };

  const handleDownloadJSON = () => {
    downloadJson(
      rootData[rootData.length - 1],
      rootData[0]?.nodeDataArray?.find((node) => node.key === '0')?.text ||
        'mind-map',
    );
  };

  const renderAction = () => {
    if (isSubmitting || aiMutation.isPending)
      return (
        <CustomIconButton
          onClick={handleCancelAiMutation}
          color="error"
          type="submit"
        >
          <StopOutlinedIcon />
        </CustomIconButton>
      );

    return (
      <CustomIconButton
        disabled={!formState.isValid}
        color="primary"
        type="submit"
      >
        <EastOutlinedIcon />
      </CustomIconButton>
    );
  };

  const renderResetAction = () => {
    return (
      <div className="absolute right-0 top-0 p-6 z-10 flex items-center gap-3">
        <div>
          {aiMutation.isPending ? (
            <div className="flex items-center gap-3">
              <p>Fetching</p>
              <CircularProgress size={16} />
            </div>
          ) : error ? (
            <p>{error}</p>
          ) : null}
        </div>
        <div>
          <Button
            color="primary"
            variant="contained"
            disableElevation
            endIcon={<AddOutlinedIcon />}
            onClick={handleNewMap}
            disabled={
              aiMutation.isPending ||
              suggestionsQuery.isLoading ||
              rootData.length === 0
            }
          >
            New Map
          </Button>
        </div>
        <div>
          <Button
            variant="contained"
            color="secondary"
            disableElevation
            endIcon={<ArrowDownwardOutlinedIcon />}
            onClick={handleDownloadJSON}
          >
            Download JSON
          </Button>
        </div>

        <div>
          <Button
            endIcon={<DeleteForeverOutlinedIcon />}
            onClick={handleResetState}
          >
            Clear
          </Button>
        </div>
      </div>
    );
  };

  const renderMindMapPage = () => {
    const model = rootData[rootData.length - 1];
    console.log(`model->`, model, id);
    return (
      <>
        <Script
          type="text/javascript"
          src={scriptSrc}
          onError={(e) => {
            console.log(`error->`, e);
          }}
          onLoad={onScriptLoad}
          strategy="lazyOnload"
        />
        {model ? (
          <div className="relative">
            <MindMap
              scriptLoaded={scriptLoaded}
              shouldRender={!!id}
              model={model}
              onLoadChildNodes={onLoadChildNodes}
            />
            {renderResetAction()}
          </div>
        ) : (
          <form
            className="relative w-screen h-screen flex flex-col items-center justify-center"
            onSubmit={handleSubmit(handleTriggerInitialQuery)}
          >
            <div className="p-6 w-full max-w-lg">
              <Controller
                name="text"
                control={control}
                rules={{ required: 'This field is required' }}
                render={({ field }) => {
                  return (
                    <TextField
                      fullWidth
                      variant="outlined"
                      autoFocus
                      disabled={
                        suggestionsQuery.isLoading || aiMutation.isPending
                      }
                      placeholder={'e.g. A vacation planning to london'}
                      slotProps={{
                        input: {
                          classes: {
                            input: 'py-8',
                            root: 'rounded-2xl',
                            notchedOutline: 'rounded-2xl',
                          },

                          endAdornment: (
                            <InputAdornment position="end">
                              {renderAction()}
                            </InputAdornment>
                          ),
                        },
                      }}
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                          const suggestions = suggestionsQuery.data?.list || [];
                          const currentIndex = suggestions.findIndex(
                            (item) => item.text === field.value,
                          );

                          if (suggestions.length === 0) {
                            return; // Do nothing if there are no suggestions
                          }

                          let nextIndex = currentIndex;
                          if (e.key === 'ArrowRight') {
                            nextIndex =
                              currentIndex === suggestions.length - 1
                                ? suggestions.length - 1
                                : currentIndex + 1;
                          } else if (e.key === 'ArrowLeft') {
                            nextIndex =
                              currentIndex === 0 ? 0 : currentIndex - 1;
                          }

                          if (nextIndex !== -1) {
                            field.onChange(suggestions[nextIndex].text || '');
                          }
                          e.preventDefault();
                        }
                      }}
                      helperText={
                        aiMutation.isPending ? (
                          <LoadingText isLoading>
                            Fetching suitable results
                          </LoadingText>
                        ) : suggestionsQuery.isLoading ||
                          !suggestionsQuery.data ? null : (
                          <span className="flex items-center gap-2">
                            <Typography component="span" variant="body2">
                              Use
                            </Typography>
                            <WestOutlinedIcon fontSize="small" />
                            <Typography component="span" variant="body2">
                              or{' '}
                            </Typography>
                            <EastOutlinedIcon fontSize="small" />
                            <Typography component="span" variant="body2">
                              to see suggestions
                            </Typography>
                          </span>
                        )
                      }
                    />
                  );
                }}
              />
              {suggestionsQuery.isLoading && (
                <div>
                  <Typography>Please wait, setting things up</Typography>
                </div>
              )}
              <div className="px-2">
                <Typography color="red" fontSize={12}>
                  {aiMutation.error?.message}
                </Typography>
              </div>
            </div>
          </form>
        )}
        <MindMapNodeFetchDialog
          open={!!currentKey}
          isSubmitting={aiMutation.isPending}
          onSubmit={handleFetchChildNodes}
          onCancel={handleCancelAiMutation}
          onClose={() => setCurrentKey(null)}
        />
      </>
    );
  };

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      document.querySelector(`script[src="${scriptSrc}"]`) &&
      (window as any).go
    ) {
      onScriptLoad();
    }
  }, []);

  useEffect(() => {
    if (id) {
      const storedMap = getMindMapData();

      if (storedMap[id]) {
        setRootData([storedMap[id]]);
      }
    }
  }, [id]);
  return renderMindMapPage();
};

export default MindMapClientPage;
