# Study Log

I have integrated a clean, native-looking feature that allows you to tag the specific source or study material for the questions you solved.

The Prompt to Copy and Paste:

"Act as an expert mobile app developer specializing in iOS development and Apple’s Human Interface Guidelines (HIG). I want to build a minimalist, premium Exam Question Tracker app. The design should be inspired by the clean aesthetics of Apple OS (using plenty of whitespace, system blurs, smooth animations, and SF Pro typography), but it should look like its own modern utility app.

Please write the code/architecture for this app with the following specifications:

1. Onboarding / Welcome Screen

 * When the app opens for the very first time, show a clean, native-looking setup screen asking the user to choose their stream:

   * JEE (Tracks Physics, Chemistry, and Mathematics)

   * NEET (Tracks Physics, Chemistry, and Biology)

 * Save this preference so the app remembers it on future launches, but allow changing it later in settings.

2. Core Feature: Daily Manual Entry & Source Tracking

 * A clean dashboard displaying cards for the three selected subjects based on the chosen stream.

 * Each subject card should feature an elegant numeric keypad popover/text field to directly type the exact number of questions solved today.

 * Source/Material Selector: Below the numeric input, add a sleek iOS native Picker or a horizontal scrolling list of 'chips' to select where the questions were solved from. Default options should include:

   * Coaching Modules

   * PYQs (Previous Year Questions)

   * Reference Books

   * NCERT

   * Mock Tests

   * Custom (Allow the user to add their own source name)

 * A prominent 'Save' or 'Log' button that updates the daily total with smooth haptic feedback.

3. Extra Features:

 * Goal Progress: Allow setting a daily target for total questions. Show a clean, minimalist linear progress bar or a modern custom gauge (inspired by Apple Watch UI) to show how close the user is to their target.

 * Exam Level Toggles: Include simple iOS-style segmented controls on the entry screen to specify if the questions solved were 'Main / Advanced' (for JEE) or 'Section A / Section B' (for NEET).

 * Analytics Tab: A dedicated section using modern, minimalist charts to see weekly and monthly trends. The charts should allow filtering not just by subject, but also by the Source Material (e.g., 'Show me how many PYQs I did this week').

 * Streak Badges: A subtle, clean streak counter that rewards consistency.

4. UI & Styling (Apple OS Inspired):

 * Colors: Use native Apple system colors (e.g., systemBlue for Physics, systemMint for Chemistry, systemIndigo for Math, systemGreen for Biology).

 * Visuals: Use subtle glassmorphic cards (ultra-thin background blur materials) against a clean system background. Support both system Light and Dark modes flawlessly.

 * Typography: Bold, clean headers using the system font (SF Pro).

Please break down the development steps, outline the file structure, and provide the core SwiftUI (or React Native) code to build this setup flow, input dashboard, and source selector."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://srlumina.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e96ac1dd-237e-4c00-a9f8-866f80ebef24).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
