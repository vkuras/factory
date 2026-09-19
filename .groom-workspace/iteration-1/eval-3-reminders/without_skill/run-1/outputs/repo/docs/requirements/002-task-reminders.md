# 002 – Task reminders

- Type: Feature
- Status: Groomed (ready for architecture)
- Depends on: 001 Task list MVP

## Problem
Employees forget tasks that are due soon. They also forget tasks that are already overdue. The Meister only notices overdue work by checking the list himself.

## Goal
Employees get a push notification on their company phone before a task is due. They get another every working day while it is overdue. The Meister gets one notification when a task is seriously overdue. Nobody is disturbed on weekends or public holidays.

## Definitions
- **Working day:** Monday to Friday, except public holidays in Bavaria (Germany).
- **Reminder time:** 07:00 local time (Germany), on working days only. The time is fixed and not configurable.
- **Open task:** a task with status "open".
- **Overdue:** an open task whose due date is in the past (the due day itself is not overdue).
- **Morning digest:** one push notification per person per working day. It bundles all the tasks relevant to that person that morning. It is never sent as one notification per task.

## Scope
Only open tasks **with** a due date get reminders. Tasks without a due date never get one. Done tasks never get one.

## Stories

### R1 – Employee: reminder before the due date
An employee gets his open tasks in the morning digest on the **last working day before** the due date.

Acceptance criteria
- Nothing is sent on the due date itself.
- If the day before the due date is not a working day, the reminder moves back to the last working day before it.
- A task that is created, or given its due date, after that working day's 07:00 reminder has passed gets no pre-due reminder. The employee sees it in his task list. There is no immediate or "new task" push.

### R2 – Employee: daily reminder while overdue
From the **first working day after** the due date, the task appears in the employee's morning digest **every working day** until it is done.

### R3 – Meister: one-time notice for overdue tasks
The Meister gets a task in his morning digest **once**, on the **2nd working day after** the due date, if the task is still open.

Acceptance criteria
- The notice is not repeated afterwards, even if the task stays open.
- If several tasks reach this point on the same morning, they arrive in one digest.
- The Meister gets no other reminders from this feature.

### R4 – Meister controls reminders per employee
The Meister can switch reminders on or off per employee.

Acceptance criteria
- Employees cannot switch their own reminders off.
- A switched-off employee gets no reminders (R1, R2).
- Switching an employee off does not affect the Meister's overdue notice (R3) for that employee's tasks.

### R5 – Digest content
Each digest lists the relevant tasks, separated into "due soon" and "overdue". For each task it shows at least the title, the customer name and the due date. Tapping the notification opens the app on the task list.

## Behaviour on changes
Reminders always follow the task's **current** state at reminder time.
- If a task is marked done, it is no longer reminded.
- If the due date is changed, reminders are based on the new date.
- If the task is reassigned, the new assignee gets the reminders and the previous assignee gets none.
- If the due date is removed, the task gets no more reminders.

## Examples
Assumed calendar: Mon to Fri are working days unless marked otherwise.

| Due date | Employee: before due (R1) | Employee: overdue, daily (R2) | Meister notice (R3) |
|---|---|---|---|
| Wed | Tue | Thu, Fri, Mon, ... | Fri |
| Mon | previous Fri | Tue, Wed, ... | Wed |
| Sat | Fri | Mon, Tue, ... | Tue |
| Sun | Fri | Mon, Tue, ... | Tue |
| Wed, Tue is a holiday | Mon | Thu, Fri, ... | Fri |
| Fri, Thu is a holiday | Wed | Mon, Tue, ... | Tue |

## Stakeholder decisions (for traceability)
- Only the employee gets regular reminders. The Meister is notified only for overdue tasks, and only once.
- The employee does **not** get a reminder on the due date itself (explicitly decided).
- There are no reminders for tasks without a due date.
- There is no reminder on weekends or Bavarian public holidays. Reminders move **earlier** (to Friday or the working day before), never later.
- The Meister controls the on/off switch per employee. Employees cannot opt out. There is no per-employee reminder time.
- Notifications are sent as push to the Taskli app on the company phones.

## Assumptions (not explicitly confirmed)
- "Bavarian public holidays" means the state-wide holidays, including Assumption Day (15 Aug). The Augsburg-only holiday (8 Aug) does not count. 24 and 31 Dec are working days.
- New employees have reminders switched **on** by default.
- If a task's due date is changed after the Meister notice was sent, and the task becomes overdue again against the new date, the Meister is notified once more.
- Existing tasks get reminders from launch day onward. Reminders that would have fallen before launch are not sent afterwards.

## Out of scope
- Reminders by e-mail, SMS or any other channel besides push.
- A fallback when a phone does not accept push notifications.
- Per-user reminder times and employee self-service settings.
- Reminders for tasks without a due date, and a "new task assigned" notification.

## Left to architecture
These decisions are deliberately not made here:
- The push provider and delivery mechanism. The stakeholder **prefers OneSignal** because he knows it, but it is not required. The architect decides.
- How Bavarian public holidays are determined and kept up to date.
- How and when the 07:00 digests are produced, and how duplicate or missed sends are avoided (for example after downtime).
- How phones register for push, and how the app asks for notification permission.
- Where and how the per-employee on/off setting is stored and shown to the Meister.

## Open points for the stakeholder
- Should the Meister be able to see whether an employee's phone actually receives push notifications? Today this is out of scope.
