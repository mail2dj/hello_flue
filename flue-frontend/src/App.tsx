import { useFlueAgent } from "@flue/react";
import { createFlueClient } from "@flue/sdk";
import { useMemo, useState, type SubmitEventHandler } from "react";

function App() {
  const [message, setMessage] = useState("");

  const client = useMemo(
    () =>
      createFlueClient({
        url: "http://localhost:5173/agents/cs",
        token: "TRUSTME",
      }),
    [],
  );

  const { sendMessage, messages, status } = useFlueAgent({
    client,
  });

  const onSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const submittedMessage = message.trim();
    if (!submittedMessage) return;

    setMessage("");
    await sendMessage(submittedMessage);
  };

  const handleSuggestion = (promptText: string) => {
    setMessage(promptText);
  };

  const isThinking = status === "streaming" || status === "submitted";

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* 상단 네비게이션 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-6 bg-zinc-900/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>🎧 Customer Service Agent</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium">
                온라인
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="hidden sm:inline-block rounded-md bg-white/5 px-2 py-1 text-[11px] text-zinc-400 border border-white/5">
            💬 인사 & 상담
          </span>
          <span className="hidden sm:inline-block rounded-md bg-white/5 px-2 py-1 text-[11px] text-zinc-400 border border-white/5">
            🌐 영어 · 대만어 · 중국어 ↔ 한국어 번역
          </span>
        </div>
      </header>

      {/* 대화 영역 */}
      <div className="flex flex-1 overflow-hidden">
        <section
          aria-label="Conversation"
          className="flex-1 flex flex-col mx-auto w-full max-w-3xl overflow-y-auto px-4 py-6 gap-6"
        >
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center my-auto py-12">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-2xl mb-4 shadow-lg shadow-indigo-500/10">
                👋
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">
                안녕하세요! 무엇을 도와드릴까요?
              </h2>
              <p className="max-w-md text-xs mt-2 text-zinc-400 leading-relaxed">
                친절한 고객 상담과 함께 <strong>영어</strong>, <strong>대만어(대만 번체)</strong>, <strong>중국어</strong>의 자연스러운 한국어 번역을 지원합니다.
                <br />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  (물리적 파일 접근 없이 안전하게 대화창에서 바로 안내해 드립니다.)
                </span>
              </p>

              {/* 추천 질문 카드 */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-left">
                <button
                  type="button"
                  onClick={() => handleSuggestion("안녕하세요! 오늘 날씨도 좋은데 인사 나눠요.")}
                  className="rounded-xl border border-white/10 bg-zinc-900/80 p-3 hover:bg-zinc-800/80 hover:border-white/20 transition text-left group"
                >
                  <p className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition">
                    💬 친절한 인사 나누기
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    "안녕하세요! 오늘 날씨도 좋은데 인사 나눠요."
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSuggestion("다음 영어 이메일을 정중한 한국어 비즈니스 메일로 번역해줘: 'Thank you for your prompt response. We would like to proceed with the proposal.'")}
                  className="rounded-xl border border-white/10 bg-zinc-900/80 p-3 hover:bg-zinc-800/80 hover:border-white/20 transition text-left group"
                >
                  <p className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition">
                    🇺🇸 영어 ➔ 한국어 번역
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    비즈니스 이메일 정중한 한국어 번역
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSuggestion("대만(Taiwan)에서 자주 쓰는 정중한 감사 인사와 비즈니스 표현을 대만 번체자와 한국어로 알려줘.")}
                  className="rounded-xl border border-white/10 bg-zinc-900/80 p-3 hover:bg-zinc-800/80 hover:border-white/20 transition text-left group"
                >
                  <p className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition">
                    🇹🇼 대만어(번체) ➔ 한국어
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    대만 현지 표현 및 번체자 번역
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSuggestion("중국어 문장 '非常感谢您的耐心等待，我们将尽快为您处理。'를 자연스러운 한국어로 번역해줘.")}
                  className="rounded-xl border border-white/10 bg-zinc-900/80 p-3 hover:bg-zinc-800/80 hover:border-white/20 transition text-left group"
                >
                  <p className="text-xs font-medium text-zinc-200 group-hover:text-emerald-400 transition">
                    🇨🇳 중국어 ➔ 한국어 번역
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    고객 응대 중국어 문장 번역
                  </p>
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <article
              className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
              key={msg.id}
            >
              <strong className="px-1 text-xs font-medium text-zinc-500">
                {msg.role === "user" ? "You" : "CS Agent"}
              </strong>
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600/90 px-4 py-2.5 text-zinc-100 shadow-md leading-relaxed"
                    : "max-w-[90%] rounded-2xl rounded-bl-md bg-zinc-900 border border-white/10 px-5 py-3.5 text-zinc-200 shadow-sm leading-relaxed"
                }
              >
                {msg.parts.map((part, index) => {
                  if (part.type === "reasoning") {
                    return (
                      <em
                        className="block my-1 text-xs text-zinc-500 not-italic border-l-2 border-zinc-700 pl-2.5"
                        key={`${msg.id}-${index}`}
                      >
                        {part.text}
                      </em>
                    );
                  }
                  if (part.type === "text") {
                    return (
                      <p
                        className="whitespace-pre-wrap text-[14px] leading-relaxed"
                        key={`${msg.id}-${index}`}
                      >
                        {part.text}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </article>
          ))}

          {isThinking && (
            <div
              aria-label="Assistant is thinking"
              className="flex items-center gap-2 px-1 text-xs text-zinc-400"
              role="status"
            >
              <span className="size-2 animate-ping rounded-full bg-indigo-400" />
              상담원이 답변을 작성하고 있습니다...
            </div>
          )}
        </section>
      </div>

      {/* 하단 입력 폼 */}
      <div className="border-t border-white/10 bg-zinc-900/60 backdrop-blur-md p-4">
        <form className="mx-auto w-full max-w-3xl" onSubmit={onSubmit}>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-2 pl-4 shadow-xl focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
            <input
              autoFocus
              className="h-10 flex-1 bg-transparent text-[14px] text-zinc-100 outline-none placeholder:text-zinc-500"
              id="message"
              name="message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="상담 문의 사항이나 번역할 문장을 입력하세요..."
              type="text"
              value={message}
            />
            <button
              aria-label="Send message"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600"
              disabled={isThinking || !message.trim()}
              type="submit"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24">
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
      </div>
    </main>
  );
}

export default App;
