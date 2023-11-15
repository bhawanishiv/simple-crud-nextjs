import React, { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';
import jsYml from 'js-yaml';

import { cn } from '@/lib/utils';
import _ from 'lodash';

import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

import MindMap from '@/components/MindMap';

import { MIND_MAP_PROMPT_HELPER } from '@/lib/constants';
import { OPENAI_COMPLETION_API_ENDPOINT } from '@/lib/urls';

type MindMapPageProps = {};

type InitialState = {
  text: string;
  query: string;
  prompt?: string;
  data: string[];
  createdAt: string;
  completed?: boolean;
  pending?: boolean;
  finishReason: string;
  rootState?: any;
};

const initialResponse: InitialState = {
  createdAt: '',
  data: [],
  text: '',
  query: '',
  finishReason: '',
};

const MindMapPage: React.FC<MindMapPageProps> = (props) => {
  const {} = props;

  const [response, setResponse] = useState(initialResponse);
  const [data, setData] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [triggerNext, setTriggerNext] = useState(0);

  const { formState, register, handleSubmit } = useForm();

  const { isSubmitting } = formState;

  const handleResetState = () => {
    setLoading(false);
    setResponse(initialResponse);
    setData([]);
    setErrorMessage('');
  };

  const playgroundResponseHandlers = async ({ prompt }: { prompt: string }) => {
    const payload = {
      model: 'text-davinci-003',
      // stream: true,
      temperature: 0.7,
      max_tokens: 256,
      best_of: 1,
      prompt,
    };

    const res = await fetch(OPENAI_COMPLETION_API_ENDPOINT, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log(`res->`, res);

    const data = await res.json();
    console.log(`data->`, data);

    if (!data || !data.choices || !data.choices.length) throw new Error();

    const { text, finish_reason } = data.choices[data.choices.length - 1];

    setResponse((prevResponse) => {
      const newResponse = { ...prevResponse };
      newResponse.text = newResponse.text + text;
      newResponse.finishReason = finish_reason;
      return newResponse;
    });

    setTriggerNext((t) => t + 1);
  };

  const getPrompt = (text: string) => {
    return MIND_MAP_PROMPT_HELPER + '\n' + text;
  };

  const handleDataComplete = async () => {
    console.log(`response->`, response);

    let parsedSchema: any = jsYml.load(response.text);

    console.log(`parsedSchema->`, parsedSchema);

    setResponse((prevResponse) => {
      const newResponse = { ...prevResponse };
      newResponse.pending = false;
      newResponse.completed = true;
      newResponse.rootState = parsedSchema;
      return newResponse;
    });

    setData((d) => {
      const data = [...d];
      const lastData = data[data.length - 1];
      data.push({
        ...(data.length ? {} : parsedSchema),
        nodeDataArray: [
          ...(lastData ? lastData.nodeDataArray : []),
          ...(data.length ? parsedSchema : parsedSchema.nodeDataArray),
        ],
      });
      return data;
    });
  };

  const fetchPendingResponse = async () => {
    try {
      setLoading(true);
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
        await handleDataComplete();
      }
    } catch (e: any) {
      console.log(`e->`, e);
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerInitialQuery = async (values: any) => {
    try {
      setErrorMessage('');
      // setResponse(initialValues);

      const prompt = getPrompt(values.text);

      setResponse((state) => ({ ...state, query: values.text, prompt }));
      await playgroundResponseHandlers({
        prompt,
      });
    } catch (e) {
      //
    }
  };

  const onLoadChildNodes = async (key: string) => {
    try {
      setLoading(true);

      const { nodeDataArray } = data[data.length - 1];

      const obj: any = {};
      let root: any;

      for (let item of nodeDataArray) {
        obj[item.key] = item;
        if (item.key === '0') {
          root = item;
        }
      }

      let item = obj[key];

      if (!item) throw new Error();

      const text = `Fetch the child nodes of '${item.text}' mind map\nNote: '${item.text}' is sub mind map of '${root.text}' mind map`;

      const parents = [];

      while (Boolean(item)) {
        parents.push(
          _.pick(item, ['key', 'text', 'parent', 'dir', 'brush', 'dir'])
        );
        item = obj[item.parent];
      }

      const str = jsYml.dump({ parents });
      const prompt = text + '\n\n' + str + '\nremainingNodes:';

      console.log(`prompt->`, prompt);

      setResponse({
        ...initialResponse,
        query: key,
        prompt,
        finishReason: 'length',
      });
      await playgroundResponseHandlers({
        prompt,
      });
    } catch (e: any) {
      console.log(`e->`, e);
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAction = () => {
    if (isSubmitting || loading)
      return (
        <div className="px-2">
          <CircularProgress size={16} />
        </div>
      );

    return (
      <IconButton type="submit">
        <SendOutlinedIcon />
      </IconButton>
    );
  };

  const renderResetAction = () => {
    return (
      <div className="absolute right-0 top-0 p-6 z-10">
        <Button
          endIcon={<RefreshOutlinedIcon />}
          sx={{ borderRadius: 6 }}
          onClick={handleResetState}
        >
          Reset
        </Button>
      </div>
    );
  };

  const renderMindMapPage = () => {
    const model = data[data.length - 1];
    console.log(`data->`, data);
    return (
      <>
        {model ? (
          <div className="relative">
            <MindMap model={model} onLoadChildNodes={onLoadChildNodes} />
            {loading && (
              <div
                className="flex flex-col items-center justify-center w-screen h-screen absolute left-0 top-0 z-10"
                style={{ backgroundColor: '#d7d7d760' }}
              >
                <CircularProgress size={16} />
              </div>
            )}
            {renderResetAction()}
          </div>
        ) : (
          <form
            className="relative w-screen h-screen flex flex-col items-center justify-center"
            onSubmit={handleSubmit(handleTriggerInitialQuery)}
          >
            <div className="p-6 w-full max-w-lg">
              <div
                className={cn(
                  'relative',
                  'flex items-center overflow-hidden rounded-full',
                  'w-full',
                  'bg-background-light',
                  'border border-transparent  focus-within:border-gray'
                )}
              >
                <input
                  className="py-3 pl-4 pr-12 bg-transparent outline-none w-full"
                  placeholder="e.g. Create a mindmap for a vacation planning to london"
                  {...register('text')}
                />
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 px-1  ">
                  {renderAction()}
                </div>
              </div>
              <div className="px-2">
                <Typography color="red" fontSize={12}>
                  {errorMessage}
                </Typography>
              </div>
            </div>
          </form>
        )}
      </>
    );
  };

  useEffect(() => {
    if (triggerNext > 0) {
      fetchPendingResponse();
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNext]);

  return renderMindMapPage();
};

export default MindMapPage;
