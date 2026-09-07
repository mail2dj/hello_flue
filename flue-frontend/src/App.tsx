import { useFlueAgent } from "@flue/react";
import { useState, type SubmitEventHandler } from "react";

function App() {
  const [message, setMessage] = useState("");

  const { sendMessage, messages, status } = useFlueAgent({
    url: "http://localhost:5173/hello/world/user-1",
  });

  const onSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const submittedMessage = message.trim();
    if (!submittedMessage) return;

    await sendMessage(message);

    setMessage("");
  };

  const isThinking = status === "streaming" || status === "submitted";
  return (
    <>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>
            {message.parts.map((part) => {
              if (part.type === "reasoning") {
                return (
                  <em>
                    {part.text}
                    <br />
                  </em>
                );
              }
              if (part.type === "text") {
                return <span>{part.text}</span>;
              }
            })}
          </li>
        ))}
      </ul>
      <hr />
      {isThinking ? "Thinking..." : ""}
      <hr />
      <form onSubmit={onSubmit}>
        <input
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a message"
          type="text"
          value={message}
        />

        <button type="submit">Send</button>
      </form>
    </>
  );
}

export default App;
