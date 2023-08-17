import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [promptInput, setPromptInput] = useState("");
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    setLoading(true);
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }

      setResult(data.result);
      setPromptInput(data.result.foundResult ? "" : promptInput);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <img src="/header.png" />
        <h3>Prompt for UI</h3>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="prompt"
            placeholder="Tast et prompt"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
          />

          <input
            type="submit"
            value={loading ? "Prompter ChatGPT..." : "Prompt ChatGPT"}
            disabled={loading ? "disabled" : ""}
          />
        </form>
        <p dangerouslySetInnerHTML={{ __html: result?.content }}></p>
        {result?.image ? <img src={result?.image} /> : ""}

        {result ? (
          <div className={styles.result}>
            <h2>Message</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : (
          ""
        )}
      </main>
    </div>
  );
}
