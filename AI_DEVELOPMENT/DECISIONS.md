# Decisions

- Use Canvas 2D and project-authored geometry/audio for fast mobile loading and zero media-license risk.
- Use one-finger gravity tethering instead of a virtual joystick: holding places a gravity well, the tether damages enemies, and releasing preserves momentum.
- Finish a dense eight-rift run with two bosses rather than create an unfinished broad game.
- Use relative paths throughout for GitHub Pages project-subpath compatibility.
- Expose state controls only on loopback hosts with `?test=1`; the public Pages hostname cannot create them.
- Treat pointer capture loss, blur, backgrounding, and rotation as explicit lifecycle paths; every path releases the tether, and paused audio restarts only from a user gesture.
- Keep combat progress visible as a compact threat count and place the energy arc at the player's finger so it can be read without looking away from the action.
- Make reduced-motion mode affect Canvas rendering and effect budgets as well as CSS animation; essential physics and combat telegraphs remain intact.
- Keep visual-effect randomness on a separate seeded stream so accessibility or automatic quality settings cannot alter gameplay outcomes.
