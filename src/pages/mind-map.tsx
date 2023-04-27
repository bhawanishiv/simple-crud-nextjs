import React, { useEffect, useState } from 'react';
import {
  fetchEventSource,
  EventStreamContentType,
} from '@microsoft/fetch-event-source';
import { useForm } from 'react-hook-form';
import jsYml from 'js-yaml';

import cx from 'classnames';
import moment from 'moment';
import _ from 'lodash';

import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

import MindMap from '@/components/MindMap';

import { OPENAPI_API_KEY, MIND_MAP_PROMPT_HELPER } from '@/lib/constants';
import { OPENAPI_API_ENDPOINT } from '@/lib/urls';

type ResponseItem =
  | string
  | {
      [key: string]: ResponseItem[];
    };

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
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [triggerNext, setTriggerNext] = useState(0);

  const { formState, register, handleSubmit } = useForm();

  const { isSubmitting } = formState;

  const playgroundResponseHandlers = async ({ prompt }: { prompt: string }) => {
    try {
      setLoading(true);

      const payload = {
        model: 'text-davinci-003',
        stream: true,
        temperature: 0.7,
        max_tokens: 128,
        best_of: 1,
        prompt,
      };

      await fetchEventSource(OPENAPI_API_ENDPOINT, {
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
    } catch (e) {
      setLoading(false);
    }
  };

  const getPrompt = (text: string) => {
    return MIND_MAP_PROMPT_HELPER + '\n' + text;
  };

  const processResponseHelper = (
    nodes: ResponseItem[],
    depth: number,
    parentX: number,
    parentId: string,
    nodeObj: any,
    edgesObj: any
  ) => {
    const y = depth * 100;
    for (let i = 0; i < nodes.length; i++) {
      const id = `${parentId}-${i}`;
      const x =
        Math.floor(1200 / nodes.length) * (i + 1) - Math.floor(parentX / 2);

      const node = nodes[i];

      const keys = Object.keys(node);

      const label = typeof node === 'string' ? node : keys[0];

      nodeObj[id] = {
        data: {
          label,
        },
        position: {
          x,
          y,
        },
      };

      edgesObj[`e${parentId}-${i}`] = {
        source: parentId,
        target: id,
      };

      if (typeof node === 'object' && Array.isArray(node[keys[0]])) {
        processResponseHelper(
          node[keys[0]],
          depth + 1,
          x,
          id,
          nodeObj,
          edgesObj
        );
      }
    }
  };

  const processResponse = (response: ResponseItem[]) => {
    const nodesObj: { [key: string]: any } = {};
    const edgesObj: { [key: string]: any } = {};

    processResponseHelper(response, 0, 1200, '', nodesObj, edgesObj);
    console.log(`nodesObj->`, nodesObj);
    console.log(`edgesObj->`, edgesObj);

    return {
      nodes: Object.keys(nodesObj).map((key) => ({
        ...nodesObj[key],
        id: key,
      })),
      edges: Object.keys(edgesObj).map((key) => ({
        ...edgesObj[key],
        id: key,
      })),
    };
  };

  const handleInitialDataComplete = async () => {
    console.log(`response->`, response);
    let parsedSchema: any = jsYml.load(response.text.trim());

    console.log(`parsedSchema->`, parsedSchema);

    // const rootState = processResponse(tempData as ResponseItem[]);

    // console.log(`rootState->`, rootState);

    setResponse((prevResponse) => {
      const newResponse = { ...prevResponse };
      newResponse.pending = false;
      newResponse.completed = true;
      newResponse.rootState = parsedSchema;
      return newResponse;
    });
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
        await handleInitialDataComplete();
      }
    } catch (e) {
      console.log(`e->`, e);
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

  const renderAction = () => {
    if (isSubmitting || loading) return <CircularProgress size={16} />;

    return (
      <IconButton type="submit">
        <SendOutlinedIcon />
      </IconButton>
    );
  };

  const renderMindMapPage = () => {
    return (
      <>
        {response.completed && response.rootState ? (
          <MindMap model={response.rootState} />
        ) : (
          <form
            className="w-screen h-screen flex flex-col items-center justify-center"
            onSubmit={handleSubmit(handleTriggerInitialQuery)}
          >
            <div className="p-6 w-full  max-w-lg">
              <div
                className={cx(
                  'flex items-center overflow-hidden rounded-full',
                  'w-full',
                  'bg-background-light',
                  'border border-transparent  focus-within:border-gray'
                )}
              >
                <input
                  className="py-3 px-4 bg-transparent outline-none w-full"
                  placeholder="e.g. Create a mindmapPage for a vacation planning to london"
                  {...register('text')}
                />
                <div className="px-2">{renderAction()}</div>
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
