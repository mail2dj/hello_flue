import { useFlueAgent } from "@flue/react";
import { createFlueClient } from "@flue/sdk";
import { useEffect, useMemo, useRef, useState, type SubmitEventHandler, type ChangeEvent } from "react";

interface SandboxFile {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
}

function App() {
  const [message, setMessage] = useState("");
  const [sandboxFiles, setSandboxFiles] = useState<SandboxFile[]>([]);
  const [workspaceDir, setWorkspaceDirState] = useState<string>("C:\\Users\\mail2\\Documents\\sandBox");
  const [isEditingDir, setIsEditingDir] = useState(false);
  const [dirInput, setDirInput] = useState("");
  const [showFileDrawer, setShowFileDrawer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  // 현재 활성화된 작업 디렉토리 조회
  const fetchWorkspaceDir = async () => {
    try {
      const res = await fetch("http://localhost:5173/api/sandbox/dir", {
        headers: { Authorization: "TRUSTME" },
      });
      const data = await res.json();
      if (data.ok && data.dir) {
        setWorkspaceDirState(data.dir);
      }
    } catch (err) {
      console.error("Failed to fetch workspace dir", err);
    }
  };

  // sandBox 물리 디렉토리 파일 목록 조회
  const fetchSandboxFiles = async () => {
    try {
      const res = await fetch("http://localhost:5173/api/sandbox/files", {
        headers: { Authorization: "TRUSTME" },
      });
      const data = await res.json();
      if (data.ok) {
        setSandboxFiles(data.files || []);
        if (data.sandboxDir) {
          setWorkspaceDirState(data.sandboxDir);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sandbox files", err);
    }
  };

  useEffect(() => {
    fetchWorkspaceDir();
    fetchSandboxFiles();
  }, []);

  // 작업 디렉토리 변경 저장
  const handleSaveDir = async () => {
    if (!dirInput.trim()) return;
    try {
      const res = await fetch("http://localhost:5173/api/sandbox/dir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "TRUSTME",
        },
        body: JSON.stringify({ dir: dirInput.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setWorkspaceDirState(data.dir);
        setIsEditingDir(false);
        setStatusNotification(`📁 작업 디렉토리가 "${data.dir}" 로 성공적으로 변경되었습니다!`);
        fetchSandboxFiles();
      } else {
        alert("경로 변경 실패: " + data.error);
      }
    } catch (err: any) {
      alert("경로 변경 에러: " + err.message);
    }
  };

  // 파일 또는 폴더 업로드 처리
  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setStatusNotification("파일을 sandBox로 동기화하는 중...");

    try {
      const uploadPayload: Array<{ path: string; content: string }> = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        // 웹 브라우저에서 폴더 선택 시 webkitRelativePath가 제공됨
        const relPath = file.webkitRelativePath || file.name;
        try {
          const content = await file.text();
          uploadPayload.push({ path: relPath, content });
        } catch (e) {
          console.warn(`Could not read text for file: ${relPath}`);
        }
      }

      if (uploadPayload.length > 0) {
        const res = await fetch("http://localhost:5173/api/sandbox/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "TRUSTME",
          },
          body: JSON.stringify({ files: uploadPayload }),
        });

        const data = await res.json();
        if (data.ok) {
          const names = uploadPayload.map((f) => f.path);
          setStatusNotification(`✅ ${names.length}개 파일이 C:\\Users\\mail2\\Documents\\sandBox 에 저장되었습니다!`);
          await fetchSandboxFiles();

          // 채팅창에 자동 프롬프트 제안 입력
          if (names.length === 1) {
            setMessage(`방금 업로드한 "${names[0]}" 파일을 읽어서 원문과 함께 한국어.txt로 번역해줘`);
          } else {
            setMessage(`방금 업로드한 파일들(${names.slice(0, 3).join(", ")}${names.length > 3 ? " 등" : ""})의 내용을 확인하고 번역해줘`);
          }
        }
      }
    } catch (err: any) {
      setStatusNotification(`❌ 파일 업로드 실패: ${err.message}`);
    } finally {
      setIsUploading(false);
      // 인풋 초기화하여 동일 파일 재선택 가능하게 함
      event.target.value = "";
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  const onSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const submittedMessage = message.trim();
    if (!submittedMessage) return;

    await sendMessage(submittedMessage);
    setMessage("");
    // 에이전트 작업 후 파일 목록 새로고침
    setTimeout(fetchSandboxFiles, 3000);
  };

  const isThinking = status === "streaming" || status === "submitted";

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* 상단 네비게이션 & 물리 샌드박스 상태바 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-6 bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-sm font-semibold text-zinc-200">
            Flue File & Translation Agent
          </h1>
        {isEditingDir ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={dirInput}
              onChange={(e) => setDirInput(e.target.value)}
              placeholder="작업 디렉토리 절대경로 (예: C:\Users\mail2\Downloads)"
              className="rounded bg-zinc-800 border border-white/20 px-2.5 py-1 text-xs font-mono text-zinc-100 outline-none w-80 focus:border-emerald-500"
            />
            <button
              onClick={handleSaveDir}
              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition"
            >
              적용
            </button>
            <button
              onClick={() => setIsEditingDir(false)}
              className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block rounded-md bg-white/5 px-2.5 py-1 font-mono text-xs text-zinc-300">
              📂 {workspaceDir}
            </span>
            <button
              onClick={() => {
                setDirInput(workspaceDir);
                setIsEditingDir(true);
              }}
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10 hover:text-emerald-400 transition"
              title="클릭하여 작업 디렉토리 경로 변경"
            >
              ✏️ 경로 변경
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFileDrawer(!showFileDrawer)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
        >
          <span>📁 파일 탐색기</span>
          <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
            {sandboxFiles.filter((f) => !f.isDir).length}
          </span>
        </button>
      </div>
    </header>

      {/* 상태 알림 배너 */}
      {statusNotification && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/40 px-6 py-2 text-xs text-emerald-200 flex items-center justify-between">
          <span>{statusNotification}</span>
          <button onClick={() => setStatusNotification(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 대화 영역 */}
        <section
          aria-label="Conversation"
          className="flex-1 flex flex-col mx-auto w-full max-w-3xl overflow-y-auto px-4 py-6 gap-6"
        >
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-500">
              <span className="text-4xl mb-3">📂 ➔ 🇰🇷</span>
              <h2 className="text-base font-medium text-zinc-300">물리적 파일 번역 및 생성 에이전트</h2>
              <p className="max-w-md text-xs mt-1 text-zinc-400">
                하단의 <strong>[📄 파일 선택]</strong> 또는 <strong>[📁 폴더 선택]</strong> 버튼을 눌러 문서를 업로드하거나,
                직접 <strong>"sandBox 내 파일 목록을 보여줘"</strong>라고 요청해 보세요.
              </p>
            </div>
          )}

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
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-zinc-800 px-4 py-2.5 text-zinc-100 shadow-md"
                    : "max-w-[90%] px-1 text-zinc-300"
                }
              >
                {message.parts.map((part, index) => {
                  if (part.type === "reasoning") {
                    return (
                      <em
                        className="block my-1 text-xs text-zinc-500 not-italic border-l-2 border-zinc-700 pl-2.5"
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
                    const statusText =
                      part.state === "input-available"
                        ? "실행 중..."
                        : part.state === "output-available"
                          ? "완료"
                          : "실패";

                    return (
                      <section
                        className="my-3 w-full min-w-72 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-sm"
                        key={part.toolCallId}
                      >
                        <header className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-zinc-800/50">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-blue-400" />
                            <strong className="font-mono text-xs font-semibold text-zinc-200">
                              🛠️ {part.toolName}
                            </strong>
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              part.state === "output-error"
                                ? "text-red-400"
                                : part.state === "output-available"
                                  ? "text-emerald-400"
                                  : "text-amber-400"
                            }`}
                          >
                            {statusText}
                          </span>
                        </header>

                        <div className="p-3 text-xs font-mono space-y-2">
                          <div>
                            <span className="text-zinc-500 font-semibold">[입력 매개변수]:</span>
                            <pre className="mt-1 max-h-32 overflow-auto rounded bg-zinc-950 p-2 text-zinc-300 whitespace-pre-wrap">
                              {JSON.stringify(part.input, null, 2)}
                            </pre>
                          </div>
                          {part.state === "output-available" && (
                            <div>
                              <span className="text-emerald-500 font-semibold">[실행 결과]:</span>
                              <pre className="mt-1 max-h-40 overflow-auto rounded bg-zinc-950 p-2 text-emerald-300 whitespace-pre-wrap">
                                {JSON.stringify(part.output, null, 2)}
                              </pre>
                            </div>
                          )}
                          {part.state === "output-error" && (
                            <div>
                              <span className="text-red-400 font-semibold">[에러 내용]:</span>
                              <p className="mt-1 text-red-300">{part.errorText}</p>
                            </div>
                          )}
                        </div>
                      </section>
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
              className="flex items-center gap-2 px-1 text-sm text-zinc-400"
              role="status"
            >
              <span className="size-2 animate-ping rounded-full bg-blue-500" />
              에이전트가 생각하고 작업을 처리하는 중입니다...
            </div>
          )}
        </section>

        {/* 우측 sandBox 파일 탐색기 서랍 */}
        {showFileDrawer && (
          <aside className="w-80 border-l border-white/10 bg-zinc-900/90 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-xs font-bold text-zinc-200">📂 sandBox 폴더 내용</h2>
              <button
                onClick={fetchSandboxFiles}
                className="text-xs text-zinc-400 hover:text-white transition"
                title="새로고침"
              >
                🔄 새로고침
              </button>
            </div>

            <div className="flex-1 space-y-1">
              {sandboxFiles.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">
                  폴더가 비어 있습니다.<br />파일을 업로드하거나 에이전트에게 생성을 요청하세요!
                </p>
              ) : (
                sandboxFiles.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => {
                      if (!file.isDir) {
                        setMessage(`"${file.path}" 파일을 읽어서 원문과 함께 한국어.txt로 번역해줘`);
                      }
                    }}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition cursor-pointer ${
                      file.isDir
                        ? "bg-zinc-800/40 text-amber-200 font-medium"
                        : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{file.isDir ? "📁" : "📄"}</span>
                      <span className="truncate">{file.path}</span>
                    </div>
                    {!file.isDir && (
                      <span className="text-[10px] text-zinc-500">
                        {file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <p className="text-[11px] text-zinc-500 border-t border-white/10 pt-2">
              💡 파일을 클릭하면 번역 요청 프롬프트가 채팅창에 자동 입력됩니다.
            </p>
          </aside>
        )}
      </div>

      {/* 숨겨진 파일 및 폴더 인풋 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
        {...({ webkitdirectory: "", directory: "" } as any)}
      />

      {/* 하단 입력 폼 및 파일/폴더 선택 툴바 */}
      <div className="border-t border-white/10 bg-zinc-900/60 p-4">
        <form className="mx-auto w-full max-w-3xl flex flex-col gap-2" onSubmit={onSubmit}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
            >
              <span>📄 파일 선택</span>
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
            >
              <span>📁 디렉토리(폴더) 선택</span>
            </button>
            {isUploading && (
              <span className="text-xs text-amber-400 animate-pulse">
                파일 복사 중...
              </span>
            )}
          </div>

          <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-zinc-900 p-2 pl-4 shadow-xl focus-within:border-white/20 focus-within:ring-2 focus-within:ring-white/10">
            <input
              autoFocus
              className="h-10 flex-1 bg-transparent text-[14px] text-zinc-100 outline-none placeholder:text-zinc-500"
              id="message"
              name="message"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="명령을 입력하세요 (예: test.txt 파일을 일본어로 번역해서 csv로 만들어줘)"
              type="text"
              value={message}
            />
            <button
              aria-label="Send message"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 transition hover:bg-white active:scale-95 disabled:opacity-50"
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
