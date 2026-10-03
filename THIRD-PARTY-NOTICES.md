# Open source acknowledgements

The following browser builds are bundled locally. Their original MIT license texts are preserved in `vendor/`. Package versions and SHA-256 hashes are recorded in `vendor/manifest.json`.

| Project | Version | Used for | Source and license |
| --- | --- | --- | --- |
| Anime.js | 4.5.0 | Photograph convergence, seal release, flap rotation and paper lift in one cancellable timeline | https://github.com/juliangarnier/anime — `vendor/animejs-LICENSE.txt` |
| Lenis | 1.3.26 | Horizontal wheel/touch interpolation and navigation | https://github.com/darkroomengineering/lenis — `vendor/lenis-LICENSE.txt` |
| StPageFlip / page-flip | 2.0.7 | Illustration cover turning, paper shadows | https://github.com/Nodlik/StPageFlip — `vendor/page-flip-LICENSE.txt` |
| tsParticles slim | 4.4.0 | Sparse floating and pulsing ambient lights | https://github.com/tsparticles/tsparticles — `vendor/tsparticles-slim-LICENSE.txt` |

## Local StPageFlip modification

The two calls to `requestAnimationFrame` in its render loop are redirected to `window.birthdayBookFrames.request`. The adapter in `letter-book.js` pauses that scoped scheduler when the book is closed, the letter replaces the cover, or the document is hidden. Rendering geometry and page-flip algorithms are unchanged. This prevents the upstream unconditional loop from continuing after the reader closes the letter.

## Choreography references

- Codrops **ImageStackGrid**: https://github.com/codrops/ImageStackGrid — MIT, original license retained as `vendor/imagestackgrid-LICENSE.txt`. The gallery-to-grid gesture informed the reverse sequence that gathers photographs into a stack. Our Anime.js implementation is newly written; the repository's GSAP and Locomotive Scroll bundles are not included.
- Kimberley Ann **Waddle**: https://github.com/thekimberleyann/waddle — MIT, original license retained as `vendor/waddle-LICENSE.txt`. The in-place envelope opening, delayed paper emergence and stage ordering informed our reveal. Our static JavaScript implementation is newly written; React, Next.js and Framer Motion are not included.

The original user photographs, letter and uploaded illustrations remain user-supplied content. Generated scenery, custom SVG props and the original synthesized instrumental are separate site assets. There are no runtime CDN dependencies.
