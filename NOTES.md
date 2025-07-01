# Init project


- Core Tech is Face detection/labeling for users to extract
- UX: from video by key frames

-- Here we assume the user has selected video upload from somewhere higher up in the experience
User Story:
- Video upload
    - if size > 20mb(?), throw error size too big for demo
- Video Playback
- "Take Photo" button to pause on video and send frame for face detection
- Faces detected
    - Assign face to character, confirm or fix
    - Remove face

Client-side Face Detection:
Library of choice: face-api.js


Key Loading States
- Video Upload/Initial-processing
- Model Load (Initial/Cached?)
- Face Detection Results Initial Load

State Management Selection:
Zustand; simple and client-first with reducers and optimization-friendly selectors.
 - Allows us to separate state management from react render tree


- Large video cache thoughts
 - Service Worker to cache video segments and intercept on video stream/load
 - Chrome lets each tab have @ max ~1.5gb of ram
    - browsers differ, stay way under this limit
 - Implementation suggestions
    - Re-use buffers in player window
    - Cap video buffer w/ seek + currentTime on <video /> element

Journal from the front
- June 30th, it's the last day of June, medium heat for California. Got started reading through the documentation of core new libraries (face-api.js)
- July 1st, the vibes of July are on the horizon. It's going to be a great month. We're building out the core UX for the site, three-panel center-video, good stuff.
 - After building out the initial functionality, I think there's a way to run this through a video autoplay and clicking to save and collect face snapshots in real time. Will play around with that after deploying and sharing the mvp.
 - Having issues w/ the video overlay rendering, will circle back
