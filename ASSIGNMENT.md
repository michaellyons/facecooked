Face Detection Video Analysis - Technical Assignment

Hey 🤓

We're excited to have you collaborate with us on this project. Feel free to chat to anyone on the Slack channel to ask questions, share progress, or bounce ideas off. It's completely free form, don't stress about it, run it the way you'd normally run projects.

Goal
Build a browser-based face detection application that allows users to analyze video content frame by frame, detect faces, and identify speakers throughout the video. We expect you to have a working demo in about a day that you can show-n-tell and get us to play with it, but feel free to stretch over several days and work on your own schedule.

Recommended stack
To avoid spending time on setup and deployment:

Next.js 15 / TypeScript
TailwindCSS / shadcn/ui or any boilerplate you prefer
Your choice for handling state - pick whatever makes sense
Deploy to Vercel so you can share previews

The Challenge
Build a face detection application that runs entirely in the browser, that's pleasant to use and can be easily extended for potential AI-first video analysis experiences.


Remember: We're not looking for a full-blown production app, but rather a solid foundation that demonstrates your thinking and approach. Focus on creating a clean, well-structured solution that could be extended in the future.

Core features

Video upload and playback (we don’t expect you to build a custom video player, a native HTML video element should be fine)
Basic video controls (play/pause, seek)

Face detection

Ability to pause at any frame and trigger face detection
Show detected faces / speakers nearby the video player (e.g., in a sidebar or panel)
Support for detecting multiple faces in a single frame
Aggregate selections by timestamps / frames and show them in the frontend state
Allow multiple detection points throughout the video
Provide an ability to label faces and clear them

Data export

Implement a mechanism to collect metadata (timestamps/frames, face positions, labels)
Format this data into a payload suitable for API transmission with user selected face(s)
Can simply console.table/log the payload structure (no actual API integration needed)

Bonus

Here are some of the nice to have features if you have time remaining:

Display interactive face meshes around detected faces (overlaid on the video)
Support for longer videos (discussing approach to scaling)
Performance optimizations for large files




What we're looking for
Technical decisions

We're interested in seeing:

How you approach browser-based video processing
Your strategy for memory management with videos
    - Store local buffer
    - Offload buffers for videos not focused, local storage should be fine but clear from client-app memory
How you handle state management
    - Zustand (see NOTES.md)
Your approach to performance optimization
    - Backend processing via wasm, using web-workers to multi-thread where possible (Not implemented) https://github.com/tensorflow/tfjs/tree/master/tfjs-backend-wasm
Error handling strategies
    - Library load errors
        - If we cant load the pre-requisite libraries for some reason, we need to show this error state
    - Processing errors
    - User action errors
    - Unknown Errors (Error Boundaries)
Code organization and architecture decisions

Product thinking & UX

This is super important to us! Show us:

How you think about user workflow
    - Users will want to easily scrub a timeline
    - Visualize the frames and faces along the timeline using avatars
    - allow jump-to-frame
Your approach to making face detection intuitive
    - Guide new users w/ info-leading UI
How you handle loading states and feedback
    - Loading on key network states w/ itemized status for clear communication
    - Toasts for core user actions
    - Background sound ping on long-running job completion (large video work)
Your ideas about making video analysis user-friendly
    - 
Any clever UX solutions for complex operations
    - Drag/drop

Technical requirements

Everything should run in the browser
Focus on desktop experience (don't worry about mobile)
Structure your code however you think makes sense
Remember to handle errors and loading states

Tips

Focus on making the core features work smoothly before adding extras
Think about memory management, especially for longer videos
Test with different videos (single person, multiple people in the frame, different lightning conditions)
Consider UX details like loading states and error messages
Take notes of your technical decisions and tradeoffs to discuss later
Don't worry about making it pixel-perfect - focus on functionality and future potential

Submission

Push your code to a private GitHub repo and share with us
Deploy to Vercel and share a preview link

Prepare to discuss during a follow-up call with our engineers:

Your technical decisions and tradeoffs
What you'd improve or do differently if you had more time
How you'd approach scaling to handle longer videos
Any challenges you faced and how you solved them
Resources

Slack for collaboration: https://sync-labs-workspace.slack.com/archives/C094ABL7CJU

