import { useFlueAgent } from "@flue/react";
import { createFlueClient } from "@flue/sdk";
import { useMemo, useState, type SubmitEventHandler } from "react";

function App() {
  const [message, setMessage] = useState("");

  const client = useMemo(
    () =>
      createFlueClient({
        url: "http://localhost:5173/agents/nico",
        token: "TRUSTME",
      }),
    [],
  );

  const { messages, status } = useFlueAgent({
    client,
  });

  const onSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const submittedMessage = message.trim();
    if (!submittedMessage) return;

    await client.send({
      message: {
        kind: "user",
        body: submittedMessage,
      },
      initialData: {
        name: "nico",
      },
    });

    setMessage("");
  };

  const isThinking = status === "streaming" || status === "submitted";
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-zinc-950 px-4 text-zinc-100">
      <section
        aria-label="Conversation"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 overflow-y-auto py-8"
      >
        {messages.map((message) => (
          <article
            className={`flex flex-col gap-1.5 ${message.role === "user" ? "items-end" : "items-start"}`}
            key={message.id}
          >
            <strong className="px-1 text-xs font-medium text-zinc-500">
              {message.role === "user" ? "You" : "Assistant"}
            </strong>
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-zinc-800 px-4 py-2.5 text-zinc-100"
                  : "max-w-[90%] px-1 text-zinc-300"
              }
            >
              {message.parts.map((part, index) => {
                if (part.type === "reasoning") {
                  return (
                    <em
                      className="text-sm text-zinc-500"
                      key={`${message.id}-${index}`}
                    >
                      {part.text}
                    </em>
                  );
                }
                if (part.type === "text") {
                  return (
                    <p
                      className="whitespace-pre-wrap text-[15px] leading-7"
                      key={`${message.id}-${index}`}
                    >
                      {part.text}
                    </p>
                  );
                }
                if (part.type === "dynamic-tool") {
                  const status =
                    part.state === "input-available"
                      ? "Running"
                      : part.state === "output-available"
                        ? "Complete"
                        : "Failed";

                  return (
                    <section
                      className="my-3 w-full min-w-72 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-sm shadow-black/20"
                      key={part.toolCallId}
                    >
                      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-zinc-400"
                          >
                            <svg
                              className="size-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="m8.5 12 2 2 5-5M5 5h14v14H5z"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </span>
                          <strong className="truncate font-mono text-xs font-medium text-zinc-300">
                            {part.toolName}
                          </strong>
                        </div>
                        <span
                          className={`shrink-0 text-[11px] font-medium ${
                            part.state === "output-error"
                              ? "text-red-300"
                              : part.state === "output-available"
                                ? "text-emerald-300"
                                : "text-zinc-500"
                          }`}
                        >
                          {status}
                        </span>
                      </header>

                      <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                        <div className="min-w-0 bg-zinc-900 p-4">
                          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                            Input
                          </p>
                          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-zinc-300">
                            {JSON.stringify(part.input, null, 2)}
                          </pre>
                        </div>

                        <div className="min-w-0 bg-zinc-900 p-4">
                          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                            Output
                          </p>
                          {part.state === "input-available" && (
                            <p className="animate-pulse text-xs text-zinc-500">
                              Waiting for result…
                            </p>
                          )}
                          {part.state === "output-available" && (
                            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-emerald-200">
                              {JSON.stringify(part.output, null, 2)}
                            </pre>
                          )}
                          {part.state === "output-error" && (
                            <p
                              className="text-xs leading-5 text-red-300"
                              role="alert"
                            >
                              {part.errorText}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  );
                }
                if (part.type === "data-progress") {
                  return <div>{JSON.stringify(part.data, null, 2)}</div>;
                }
                return null;
              })}
              {JSON.stringify(message.metadata, null, 2)}
            </div>
          </article>
        ))}
        {isThinking && (
          <div
            aria-label="Assistant is thinking"
            className="flex items-center gap-2 px-1 text-sm text-zinc-500"
            role="status"
          >
            <span aria-hidden="true" className="flex gap-1">
              <span className="size-1.5 animate-pulse rounded-full bg-zinc-500" />
              <span className="size-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:300ms]" />
            </span>
            Thinking...
          </div>
        )}
      </section>
      <form className="mx-auto w-full max-w-2xl pb-6" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <div className="flex items-end gap-3 rounded-3xl border border-white/10 bg-zinc-900 p-2.5 pl-5 shadow-2xl shadow-black/40 transition focus-within:border-white/20 focus-within:ring-4 focus-within:ring-white/5">
          <input
            autoFocus
            className="h-11 flex-1 bg-transparent text-[15px] text-zinc-100 outline-none placeholder:text-zinc-500"
            id="message"
            name="message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask anything"
            type="text"
            value={message}
          />
          <button
            aria-label="Send message"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
            type="submit"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 19V5m0 0-6 6m6-6 6 6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </form>
    </main>
  );
}

export default App;
