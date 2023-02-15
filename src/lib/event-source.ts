type EventServiceHeaders = { [key: string]: any };
type EventServiceState = 'initialized' | 'connecting' | 'open' | 'closed';
type HttpRequestMethod = 'GET' | 'POST';
type Events = 'ready' | 'message' | 'error' | 'closed';
type Listeners = { [key in Events]?: any[] };

export type EventServiceOptions = {
  headers: EventServiceHeaders;
  body?: any;
  method: HttpRequestMethod;
  withCredentials?: boolean;
};

const FIELD_SEPARATOR = ':';

export class CustomEventService {
  url: string;
  headers: EventServiceHeaders;
  readyState: EventServiceState;
  method: HttpRequestMethod;
  body: any;
  withCredentials: boolean;
  xhr: null | XMLHttpRequest;
  progress: number;
  chunk: string;
  listeners: Listeners;

  constructor(url: string, options: EventServiceOptions) {
    this.url = url;
    this.headers = options.headers || {};
    this.body = typeof options.body !== 'undefined' ? options.body : '';
    this.method = options.method || (this.body && 'POST') || 'GET';
    this.withCredentials = !!options.withCredentials;
    this.readyState = 'initialized';
    this.xhr = null;
    this.progress = 0;
    this.chunk = '';
    this.listeners = {};
  }

  addEventListener(type: Events, listener: (...params: any[]) => any) {
    if (typeof this.listeners[type] === 'undefined') {
      this.listeners[type] = [];
    }

    if (this.listeners[type].indexOf(listener) === -1) {
      this.listeners[type].push(listener);
    }
  }

  removeEventListener(type: Events, listener: (...params: any[]) => any) {
    if (typeof this.listeners[type] === 'undefined') {
      return;
    }

    const filtered: any[] = [];
    this.listeners[type].forEach(function (element) {
      if (element !== listener) {
        filtered.push(element);
      }
    });
    if (filtered.length === 0) {
      delete this.listeners[type];
    } else {
      this.listeners[type] = filtered;
    }
  }

  dispatchEvent(e?: CustomEvent | null) {
    if (!e) {
      return true;
    }

    e.source = this;

    const onHandler = 'on' + e.type;
    if (this.hasOwnProperty(onHandler)) {
      this[onHandler].call(this, e);
      if (e.defaultPrevented) {
        return false;
      }
    }

    if (this.listeners[e.type]) {
      return this.listeners[e.type].every(function (callback) {
        callback(e);
        return !e.defaultPrevented;
      });
    }
    return true;
  }

  _setReadyState(state: EventServiceState) {
    const event = new CustomEvent('readystatechange');
    event.readyState = state;
    this.dispatchEvent(event);
  }

  _onStreamFailure(e: any) {
    const event = new CustomEvent('error');
    event.data = e.currentTarget.response;
    this.dispatchEvent(event);
    this.close();
  }

  _onStreamAbort(e?: any) {
    this.dispatchEvent(new CustomEvent('abort'));
    this.close();
  }

  _onStreamProgress(e: any) {
    if (!this.xhr) {
      return;
    }

    if (this.xhr.status !== 200) {
      this._onStreamFailure(e);
      return;
    }

    if (this.readyState == 'connecting') {
      this.dispatchEvent(new CustomEvent('open'));
      this._setReadyState('open');
    }

    const data = this.xhr.responseText.substring(this.progress);
    this.progress += data.length;
    const self = this;
    data.split(/(\r\n|\r|\n){2}/g).forEach(
      function (part: string) {
        if (part.trim().length === 0) {
          self.dispatchEvent(self._parseEventChunk(self.chunk.trim()));
          self.chunk = '';
        } else {
          self.chunk += part;
        }
      }.bind(this)
    );
  }

  _onStreamLoaded(e: any) {
    this._onStreamProgress(e);

    // Parse the last chunk.
    this.dispatchEvent(this._parseEventChunk(this.chunk));
    this.chunk = '';
  }

  /**
   * Parse a received SSE event chunk into a constructed event object.
   */
  _parseEventChunk(chunk: string) {
    if (!chunk || chunk.length === 0) {
      return null;
    }

    const e = { id: null, retry: null, data: '', event: 'message' };
    chunk.split(/\n|\r\n|\r/).forEach(
      function (line: string) {
        line = line.trimRight();
        const index = line.indexOf(FIELD_SEPARATOR);
        if (index <= 0) {
          // Line was either empty, or started with a separator and is a comment.
          // Either way, ignore.
          return;
        }

        const field = line.substring(0, index);
        if (!(field in e)) {
          return;
        }

        const value = line.substring(index + 1).trimLeft();
        if (field === 'data') {
          e[field] += value;
        } else {
          e[field] = value;
        }
      }.bind(this)
    );

    const event = new CustomEvent(e.event);
    event.data = e.data;
    event.id = e.id;
    return event;
  }

  _checkStreamClosed() {
    if (!this.xhr) {
      return;
    }

    if (this.xhr.readyState === XMLHttpRequest.DONE) {
      this._setReadyState('closed');
    }
  }

  stream() {
    this._setReadyState('connecting');

    this.xhr = new XMLHttpRequest();
    this.xhr.addEventListener('progress', this._onStreamProgress.bind(this));
    this.xhr.addEventListener('load', this._onStreamLoaded.bind(this));
    this.xhr.addEventListener(
      'readystatechange',
      this._checkStreamClosed.bind(this)
    );
    this.xhr.addEventListener('error', this._onStreamFailure.bind(this));
    this.xhr.addEventListener('abort', this._onStreamAbort.bind(this));
    this.xhr.open(this.method, this.url);
    for (const header in this.headers) {
      this.xhr.setRequestHeader(header, this.headers[header]);
    }
    this.xhr.withCredentials = this.withCredentials;
    this.xhr.send(this.body);
  }

  close() {
    if (!this.xhr) {
      this._setReadyState('closed');
      return;
    }

    if (this.readyState === 'closed') {
      return;
    }

    this.xhr.abort();
    this.xhr = null;
    this._setReadyState('closed');
  }
}
