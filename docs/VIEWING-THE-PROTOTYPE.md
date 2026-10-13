# Viewing the Datum prototype (no coding needed)

The prototype is a website that runs on your own computer. You do the setup once. After that, opening it takes two steps.

## One-time setup

1. **Install Node.js.** Go to https://nodejs.org, download the version marked **LTS**, and run the installer. Accept all the defaults.
2. **Install GitHub Desktop.** Go to https://desktop.github.com, download it, and sign in with your GitHub account. You need access to the repository first. Ask Aaron to invite you.
3. **Get the code.**
   - In GitHub Desktop choose **File > Clone repository**.
   - Pick **Aaron-datum/Requirements-Prototype** from the list and click **Clone**.
   - In the top bar, click **Current Branch** and choose **datum-prototype**.
4. **Open a terminal in the project folder.**
   - In GitHub Desktop choose **Repository > Open in Terminal** (Mac) or **Open in Command Prompt** (Windows).
5. **Install the project's parts.** Type this and press Enter. It takes a minute or two:

   ```
   npm install
   ```

## Open the prototype (every time)

1. Open the terminal in the project folder (step 4 above).
2. Type this and press Enter:

   ```
   npm run dev
   ```

3. After a few seconds the terminal shows a line like `Local: http://localhost:5173/`. Open that address in your web browser.
4. Leave the terminal window open while you use the prototype. To stop it, click the terminal and press **Ctrl + C**.

## Getting updates

When Aaron says there is a new version:

1. Open GitHub Desktop. Make sure **Current Branch** says **datum-prototype**.
2. Click **Fetch origin**. If the button changes to **Pull origin**, click it.
3. If the prototype is running, stop it (**Ctrl + C**), then run `npm install` and `npm run dev` again.
4. Refresh the page in your browser.

## Tips

- Everything in the prototype is fake data, so you can click anything.
- **Settings** (bottom of the left menu) changes the color theme, text size, and navigation layout.
- If the page shows an error or looks blank, stop the prototype, run `npm install` then `npm run dev`, and reload.
- If a message says `npm: command not found`, restart the terminal. If it persists, reinstall Node.js.
