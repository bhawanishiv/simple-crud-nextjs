'use client';

import React, { useState } from 'react';

import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import jsYml from 'js-yaml';

import _ from 'lodash';
import { TGoMindMapSchema } from '@/lib/schema';

import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import EastOutlinedIcon from '@mui/icons-material/EastOutlined';

import MindMap from '@/components/ui/MindMap';

import { MIND_MAP_PROMPT_HELPER } from '@/lib/constants';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { TAiRequest } from '@/interfaces/ai';
import CustomIconButton from '@/components/ui/custom-icon-button';
import { getAiResponse } from '@/services/ai';
import { mindMapSuggestionsOptions } from '@/queries/mind-map';

// type MindMapPageProps = {
// };

type TFormValues = {
  text: string;
};

type TNodeData = {
  key: string;
  text: string;
  parent: string;
  dir?: string;
  brush?: string;
};

const MindMapClientPage = () => {
  const suggestionsQuery = useSuspenseQuery(mindMapSuggestionsOptions);

  console.log(`suggestionsQuery->`, suggestionsQuery);
  const [rootData, setRootData] = useState<TGoMindMapSchema[]>([]);
  const [error, setError] = useState<string | null>(null);

  const aiMutation = useMutation<TGoMindMapSchema | null, Error, TAiRequest>({
    mutationFn: async (data) => {
      return (await getAiResponse<TGoMindMapSchema, any>(data)).data;
    },
    onError(error) {
      setError(error.message);
    },
  });

  const { formState, control, handleSubmit } = useForm<TFormValues>({
    defaultValues: {
      text: '',
    },
  });

  const { isSubmitting } = formState;

  const handleResetState = () => {
    setRootData([]);
  };

  const addRootData = (data: TGoMindMapSchema | null) => {
    if (!data) return;
    setRootData((d) => {
      const newData = [...d];
      const lastData = newData[newData.length - 1];
      newData.push({
        ...(newData.length ? {} : data),
        nodeDataArray: [
          ...(lastData ? lastData.nodeDataArray : []),
          ...(newData.length ? data.nodeDataArray : data.nodeDataArray),
        ],
      });
      return newData;
    });
  };

  const handleTriggerInitialQuery: SubmitHandler<TFormValues> = async (
    values,
  ) => {
    try {
      const response = await aiMutation.mutateAsync({
        system: MIND_MAP_PROMPT_HELPER,
        prompt: values.text,
        stream: false,
        schema: 'mind-map',
      });
      addRootData(response);
    } catch (e) {
      //
      console.log(`e->`, e);
    }
  };

  const onLoadChildNodes = async (key: string) => {
    try {
      const { nodeDataArray } = rootData[rootData.length - 1];

      const obj: Record<string, TNodeData> = {};
      let root: TNodeData | undefined;

      for (const item of nodeDataArray) {
        obj[item.key] = item;
        if (item.key === '0') {
          root = item;
        }
      }

      let item = obj[key];

      if (!item) throw new Error();

      const text = `Fetch the child nodes of '${item.text}' mind map\nNote: '${item.text}' is sub mind map of '${root?.text}' mind map`;

      const parents: TNodeData[] = [];

      while (Boolean(item)) {
        parents.push(
          _.pick(item, ['key', 'text', 'parent', 'dir', 'brush', 'dir']),
        );
        item = obj[item.parent];
      }

      const str = jsYml.dump({ parents });
      const prompt = text + '\n\n' + str + '\nremainingNodes:';

      console.log(`prompt->`, prompt);

      const response = await aiMutation.mutateAsync({
        system: MIND_MAP_PROMPT_HELPER,
        prompt: prompt,
        stream: false,
        schema: 'mind-map',
      });

      console.log(`new_datadata->`, response);
      addRootData(response);
    } catch (e: Error) {
      console.log(`e->`, e);
    } finally {
      //
    }
  };

  const renderAction = () => {
    if (isSubmitting || aiMutation.isPending)
      return (
        <div className="px-2">
          <CircularProgress size={16} />
        </div>
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
            endIcon={<RefreshOutlinedIcon />}
            sx={{ borderRadius: 6 }}
            onClick={handleResetState}
          >
            Reset
          </Button>
        </div>
      </div>
    );
  };

  const renderMindMapPage = () => {
    const model = rootData[rootData.length - 1];
    return (
      <>
        {model ? (
          <div className="relative">
            <MindMap model={model} onLoadChildNodes={onLoadChildNodes} />
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
                      placeholder={
                        suggestionsQuery.isLoading || !suggestionsQuery.data
                          ? 'e.g. A vacation planning to london'
                          : `Press [Tab] to opt from ${suggestionsQuery.data.list.length} suggestions`
                      }
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          const suggestions = suggestionsQuery.data?.list || [];
                          const currentIndex = suggestions.findIndex(
                            (item) => item.text === field.value,
                          );

                          console.log(
                            `currentIndex->`,
                            currentIndex,
                            suggestions,
                          );
                          if (currentIndex === suggestions.length - 1) {
                            return; // Do nothing if all suggestions have been cycled through
                          }

                          const nextIndex =
                            currentIndex === -1 ? 0 : currentIndex + 1;

                          field.onChange(suggestions[nextIndex].text || '');
                          e.preventDefault();
                        }
                      }}
                      slotProps={{
                        input: {
                          classes: {
                            root: 'rounded-2xl py-4',
                            notchedOutline: 'rounded-2xl',
                          },
                          endAdornment: (
                            <InputAdornment position="end">
                              {renderAction()}
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  );
                  // <input
                  //   className="py-3 pl-4 pr-12 bg-transparent outline-none w-full"
                  //   placeholder="e.g. A vacation planning to london"
                  //   {...register('text')}
                  // />
                  // <div className="absolute right-0 top-1/2 transform -translate-y-1/2 px-1  ">
                  //   {renderAction()}
                  // </div>
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
      </>
    );
  };

  return renderMindMapPage();
};

export default MindMapClientPage;
