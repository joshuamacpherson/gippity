import "./App.css";
import MarkdownRender from "./MarkdownRender";
import { useState, useEffect, useRef } from "react";

function App() {
  /*
    message storage, if empty return empty array
  */
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem("chatMessages");
    return stored ? JSON.parse(stored) : [];
  });

  const messageRef = useRef("");
  const bottomRef = useRef(null); // for autoscroll down on msg streaming
  const streamedContentRef = useRef("");

  useEffect(() => { // loading messages
    const data = localStorage.getItem("chatMessages");
    if (data) {
      setMessages(JSON.parse(data));
    }
  }, []);

  useEffect(() => { // storing messages
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  async function sendPrompt(userMessage) {
    userMessage = userMessage.trim();
    if (!userMessage) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, index: messages.length - 1 },
    ]);

    messageRef.current = "";

    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.value = "";
      textarea.style.height = "auto"; // reset height
    }

    streamedContentRef.current = "";

    // do not change this unless you plan on adding auth
    const res = await fetch(
      `https://localhost:5000?message=${encodeURIComponent(
        userMessage
      )}`
    );

    if (!res.body) {
      console.error("No response body");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    // message streaming
    const readStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedContentRef.current += chunk;
        
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            last.content = streamedContentRef.current;
          } else {
            updated.push({
              role: "assistant",
              content: streamedContentRef.current,
              index: messages.length - 1,
            });
          }
          return updated;
        });
      }
    };

    await readStream();
  }
  
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendPrompt(messageRef.current);
    }
  };

  const handleClick = (event) => {
    event.preventDefault();
    sendPrompt(messageRef.current);
  };

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* clear that button that wipes localstorage */}
      <button
        className="absolute btn btn-error btn-lg right-8 top-8 text-xl font-[Inter]"
        onClick={() => {
          localStorage.removeItem("chatMessages");
          setMessages([]);
        }}
      >
        Clear Chat
      </button>

      {/* top left icon */}
      <div className="absolute top-6 left-6 text-6xl font-bold z-50">
        gippity
      </div>
      <div className=" flex flex-col h-screen items-center">
        <div className="relative flex-1 w-[40%] overflow-y-auto px-7 py-7 rounded-3xl p-6 scroll-hide scroll-smooth">

          {/* messages */}
          <div className="flex flex-col space-y-3 font-[Inter]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-3xl max-w-full whitespace-pre-wrap my-4 ${
                  msg.role === "user"
                    ? "bg-primary text-black self-end text-lg"
                    : "text-gray-100 self-start"
                } ${index === messages.length - 1 ? "mb-[150px]" : ""}`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownRender markdown_content={msg.content} />
                ) : (
                  <>{msg.content}</>
                )}
              </div>
            ))}
            
            {/* for auto scroll */}
            <div ref={bottomRef} />
          </div>
        </div>
        <div className="w-[40%] mx-auto mb-10">
          <div className="relative inline-block w-full">
            <textarea
              placeholder="Ask anything"
              defaultValue=""
              onChange={(e) => (messageRef.current = e.target.value)}
              onKeyDown={handleKeyDown}
              className="textarea textarea-base-100 caret-primary w-full bg-base-200 rounded-3xl resize-none text-xl focus:outline-none focus:ring-0 border border-stone-700 p-4 pr-14 max-h-48 transition-all duration-150"
              onInput={(e) => {
                window.requestAnimationFrame(() => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                });
              }}
            />
            <button
              className="absolute right-4 rounded-3xl bottom-4 w-[35px] h-[35px] p-0 btn btn-primary z-10"
              onClick={handleClick}
            ></button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
