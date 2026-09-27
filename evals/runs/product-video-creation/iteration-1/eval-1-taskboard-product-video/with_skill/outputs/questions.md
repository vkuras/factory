Here's my draft for the Taskboard video. I read the repo (README, docs/product.md, requirements 001), ran the app with `docker compose up -d` and clicked through it, so everything in scene 3 is the real app, recorded live.

Product video: Taskboard · ~80 s · narrator Zoe (Premium)

1 · Problem (~20 s)
   On screen: plain quotes in Taskboard's own colours, one speaker at a time (role only, no invented names), then the "Taskboard" wordmark.
   Ava (team lead):      "We lose stuff every week. The whiteboard gets wiped."   (your stakeholder's own words from the requirements)
   Lee (designer):       "I put it in the chat on Monday. Now it's scrolled away."
   Serena (office mgr):  "Did anyone order the toner? Nobody knows what's already done."
   Zoe:  "Small jobs come up all day. They get shouted across the room, and then they get lost."
   Zoe:  "Taskboard fixes exactly that."
2 · Access: skipped. The audience is new team members: they just open the address, there's no account and nothing to install.
3 · Product (~45 s), recorded live in the running app (laptop, then phone)
   Open list with four realistic open tasks         Zoe: "This is Taskboard. One list for the whole team. No accounts, no logins, nothing to set up."
   Types "Order toner for the printer"               Zoe: "Something comes up? Just write it down."
   Presses Enter, task appears on top                 Zoe: "Press Enter, and it’s at the top of the list, where nobody can miss it."
   Ticks "Book the meeting room for Thursday"         Zoe: "Finished something? Tick it off. It's struck through, and it moves below the open ones."
   Deletes an obsolete task                           Zoe: "And if a task isn't needed anymore, delete it."
   Phone view of the same list                        Zoe: "It works just as well on your phone, standing at the printer."
   Ticks "Order toner for the printer" on the phone   Zoe: "It's the same list for everyone. So the whole room knows the toner is ordered."
4 · Summary (~12 s)
   On screen: the final list in a browser window, address in the URL bar.
   Zoe: "No more wiped whiteboard. No more tasks lost in the chat. And everyone can see what's done."
   Zoe: "Taskboard. Just open it in your browser, on your laptop or your phone."

Open questions (my default is in brackets, so "looks good" is enough):
1. Which address do new people open, e.g. http://office-box:8080? [The README's http://localhost:8080 in the URL bar.]
2. Should the film also show how to install it (`cp .env.example .env`, `docker compose up -d`) for whoever sets it up? [No, it's for new team members, so no install scene.]
