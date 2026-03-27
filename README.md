# 🌐 Inbondz: The Decentralized Developer Index

Inbondz is a 100% decentralized, zero-database search engine built for developers, hackers, and Web3 startups. 

### ⚙️ How It Works (The Architecture)
Inbondz does not have a backend database or a traditional web crawler. It leverages the GitHub Code Search API. 
1. Developers host a specific JSON file in their public GitHub repositories.
2. When a user searches on Inbondz, our frontend JavaScript queries GitHub's API to find matching files.
3. The engine performs a parallel "double-fetch" to pull the raw URLs from those files and renders them instantly as clickable search results.

### 📜 The Protocol: How to get listed
To get your startup, portfolio, or tool listed on Inbondz, you just need to host a simple JSON file on your GitHub. 

1. Create a **public** repository on your GitHub account (e.g., `inbondz-node`).
2. Create a file in the root of that repository named exactly: **`inbondz.json`**
3. Copy the JSON template below, fill it with your data, and commit the file.

### 📝 The JSON Template
Your file must be valid JSON and include a valid `url`. Example:

```json
{
  "title": "Inbondz Search",
  "url": "[https://www.inbondz.com](https://www.inbondz.com)",
  "description": "The decentralized developer index powered entirely by GitHub and Cloudflare Workers.",
  "keywords": [
    "inbondz", 
    "search engine", 
    "decentralized", 
    "developer tools"
  ]
}
```

### ⏱️ ⚠️ The Indexing Delay (CRITICAL)
**Do not expect instant results.** GitHub's internal search crawler takes approximately **5 to 15 minutes** to index new files. 
Once you commit your `inbondz.json` file, you must wait. It will automatically appear in Inbondz search results once GitHub's global servers process the text. 

### 🔒 Rate Limits & Authentication
Because this engine runs on the GitHub API, strict rate limits apply:
* **Anonymous Users:** Limited to roughly **10 searches per minute**. 
* **Authenticated Users:** By clicking "Sign in with GitHub" on the Inbondz frontend, users securely cache a local session token via a stateless Cloudflare proxy. This increases the limit to **30 searches per minute**.
