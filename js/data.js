(function (Inkwell) {
  'use strict';

  const photo = (id) => `https://images.unsplash.com/photo-${id}?w=1200&h=630&fit=crop&q=80`;

  const covers = [
    { label: 'Laptop and code', url: photo('1498050108023-c5249f4df085') },
    { label: 'Code on screen', url: photo('1461749280684-dccba630e2f6') },
    { label: 'Programming', url: photo('1555066931-4365d14bab8c') },
    { label: 'Desk and coffee', url: photo('1499750310107-5fef28a66643') },
    { label: 'Writing notes', url: photo('1455390582262-044cdead277a') },
    { label: 'Mountains', url: photo('1470071459604-3b5ec3a7fe05') },
    { label: 'Green valley', url: photo('1501854140801-50d01698950b') },
    { label: 'Beach', url: photo('1507525428034-b723cf961d3e') },
    { label: 'Fresh food', url: photo('1490645935967-10de6ba17061') },
    { label: 'Meditation', url: photo('1506126613408-eca07ce68773') },
    { label: 'Analytics', url: photo('1551288049-bebda4e38f71') },
    { label: 'Team meeting', url: photo('1522202176988-66273c2fd55f') },
  ];

  const posts = [
    {
      id: 'seed-portfolio',
      title: 'Why Your First Portfolio Project Should Be Small',
      cover: photo('1498050108023-c5249f4df085'),
      tags: ['Career', 'Web Development'],
      author: 'Amara Okafor',
      status: 'published',
      date: '2026-09-28T09:00:00.000Z',
      likes: 38,
      content: `Most beginners start a portfolio the same way: with a plan that is far too big. A full social network, a clone of a streaming service, a marketplace with payments. Three weeks later the project is half finished, the motivation is gone, and nothing has been shown to anyone.

## Finished beats impressive

A small project that works from start to finish says more about you than a huge one that never ships. Employers look for evidence that you can take an idea, build it, fix the bugs and put it online.

Good small projects share a few traits:

- They solve one clear problem, such as converting units or tracking expenses
- They can be explained in a single sentence
- They can be finished in a weekend or two
- They work for a stranger who opens the link

## Make it feel real

Add the details that turn a demo into a product. Handle empty states, show a friendly error when the network fails, and test it on your phone. A simple app with these touches feels more professional than a flashy one without them.

> Ship the small thing, then make it better. You can always add features. You cannot add motivation.

## What to do next

Pick a problem you have this week, write one sentence describing the solution, and build only that. When it is online, write a short README with a screenshot and share the link with someone who will give honest feedback.`,
    },
    {
      id: 'seed-css-grid',
      title: 'A Practical Guide to CSS Grid Layouts',
      cover: photo('1461749280684-dccba630e2f6'),
      tags: ['CSS', 'Web Development'],
      author: 'Daniel Reyes',
      status: 'published',
      date: '2026-09-24T14:30:00.000Z',
      likes: 52,
      content: `Flexbox is excellent for laying out items in a single row or column. When you need to control rows and columns at the same time, CSS Grid is the better tool. Once the core ideas click, a lot of old layout hacks become unnecessary.

## The basics

A grid starts with one declaration on the container. You then describe the columns, and the browser places the children for you.

\`\`\`css
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
\`\`\`

The \`fr\` unit means one share of the free space, so three \`1fr\` columns are always equal.

## Responsive without media queries

This is the pattern worth memorising. It creates as many columns as fit, and each one is at least 240 pixels wide.

\`\`\`css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}
\`\`\`

Resize the window and the cards reflow on their own. No breakpoints are needed.

## Naming areas

For page layouts, named areas read almost like a diagram of the page:

\`\`\`css
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar content"
    "footer footer";
  grid-template-columns: 240px 1fr;
}
\`\`\`

## When to use which

Use **Flexbox** for components such as navigation bars and button groups. Use **Grid** for the overall layout of a page or a gallery. They work well together, and most real pages use both.`,
    },
    {
      id: 'seed-reading-code',
      title: 'How I Learned to Read Code Instead of Just Writing It',
      cover: photo('1555066931-4365d14bab8c'),
      tags: ['Career', 'Learning'],
      author: 'Mei Tanaka',
      status: 'published',
      date: '2026-09-19T11:15:00.000Z',
      likes: 27,
      content: `For my first two years as a developer I only wrote new code. Tutorials, small apps, practice exercises. Then I joined a team with a five-year-old codebase and realised I had skipped half of the job: reading what other people had written.

## Start with one feature

Do not try to understand everything. Pick a single feature, find where it begins, and follow it. A button click leads to a handler, which calls a function, which talks to an API. Writing that path down on paper makes the structure visible.

## Use the tools you already have

1. Search for a keyword from the user interface and find where it is defined
2. Read the tests, because they describe what the code is supposed to do
3. Use the debugger to step through a real request
4. Check the commit history to see why a strange line exists

## Ask better questions

Reading code made my questions to teammates much sharper. Instead of "how does the checkout work?" I could ask "why does the discount run before tax is calculated?" People answer specific questions quickly.

> The best developers I know read far more code than they write.

## A small habit

Spend twenty minutes each week reading a well-regarded open source project. Pick one file and try to explain it in your own words. You will start to notice patterns, and those patterns will show up in your own work.`,
    },
    {
      id: 'seed-slow-mornings',
      title: 'The Case for Slow Mornings',
      cover: photo('1506126613408-eca07ce68773'),
      tags: ['Wellness', 'Productivity'],
      author: 'Sofia Lindqvist',
      status: 'published',
      date: '2026-09-15T07:45:00.000Z',
      likes: 64,
      content: `For years my mornings looked the same. Alarm, phone, email, coffee gulped while standing up. By nine o'clock I felt behind on a day that had barely started.

## What I changed

I did not build a complicated routine. I made three small rules and kept them for a month:

- No screens for the first thirty minutes after waking up
- A proper breakfast, eaten sitting down
- Ten minutes of stretching or a short walk

## What happened

The difference was bigger than I expected. I stopped reacting to other people's priorities before I had thought about my own. My first hour of work became calmer, and I finished the most important task before lunch more often than not.

## It does not need to be perfect

Some mornings the kids are loud, the train is early, or I simply overslept. On those days I keep one rule and let the others go. The point is not discipline for its own sake. It is giving yourself a quiet start so the rest of the day feels like it belongs to you.

If your mornings feel rushed, try changing just one thing for a week. Notice how you feel by Friday.`,
    },
    {
      id: 'seed-mountains',
      title: 'Three Days in the Mountains Without a Phone',
      cover: photo('1470071459604-3b5ec3a7fe05'),
      tags: ['Travel', 'Wellness'],
      author: 'Sofia Lindqvist',
      status: 'published',
      date: '2026-09-09T16:20:00.000Z',
      likes: 45,
      content: `I left my phone in a locked drawer and drove to a small cabin two hours from the nearest town. The plan was simple: walk, read, sleep, repeat.

## The first day is the hardest

I kept reaching for a pocket that was empty. Every quiet moment felt like something was missing. By the afternoon the urge faded, and I noticed things I normally walk past, like how the light changes on the ridge around five o'clock.

## What I packed

- A paper map and a compass
- Two books
- A notebook and a pen
- A good pair of boots
- A small first-aid kit

## What I learned

Boredom is useful. On the second day I had more ideas than I had in the previous month. I wrote four pages of notes without a single notification interrupting them.

> Silence is not empty. It is full of answers.

## Coming back

When I turned the phone on, there were 212 messages. Not one of them needed an answer within three days. I now take a short offline break every month, even if it is only a long Sunday walk.

If you have never tried it, start with a single evening. Leave the phone in another room and see what you do instead.`,
    },
    {
      id: 'seed-async-js',
      title: 'Understanding Async JavaScript Without the Confusion',
      cover: photo('1486312338219-ce68d2c6f44d'),
      tags: ['JavaScript', 'Web Development'],
      author: 'Daniel Reyes',
      status: 'published',
      date: '2026-09-03T10:00:00.000Z',
      likes: 71,
      content: `Asynchronous code confuses almost everyone at first. The good news is that it comes down to one idea: some tasks take time, and JavaScript does not want to freeze the page while it waits.

## Callbacks, promises and async/await

Fetching data used to mean nesting callbacks inside callbacks. Promises flattened that, and \`async/await\` made it read like ordinary code.

\`\`\`js
async function loadUser(id) {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    if (!response.ok) throw new Error('User not found');
    return await response.json();
  } catch (error) {
    console.error(error.message);
    return null;
  }
}
\`\`\`

The \`await\` keyword pauses this function only. The rest of the page keeps running.

## Run things in parallel

A common mistake is awaiting requests one after another when they do not depend on each other:

\`\`\`js
const [user, posts] = await Promise.all([
  loadUser(1),
  loadPosts(1),
]);
\`\`\`

Both requests start together, and the page waits for the slower one instead of the sum of both.

## Three rules to remember

1. Always handle errors with \`try/catch\` or \`.catch()\`
2. Never forget \`await\`, or you will get a promise instead of data
3. Use \`Promise.all\` when requests are independent`,
    },
    {
      id: 'seed-meal-prep',
      title: 'Meal Prep for People Who Hate Meal Prep',
      cover: photo('1490645935967-10de6ba17061'),
      tags: ['Food', 'Productivity'],
      author: 'Amara Okafor',
      status: 'published',
      date: '2026-08-27T18:30:00.000Z',
      likes: 19,
      content: `Traditional meal prep means cooking five identical lunches on Sunday and eating them until you can no longer look at chicken and rice. I tried it twice and quit both times. What works for me is much lighter.

## Prep ingredients, not meals

Instead of finishing whole meals, I cook a few building blocks that can be combined in different ways:

- A big pot of grains such as rice, quinoa or couscous
- A tray of roasted vegetables
- One protein, like beans, eggs or baked fish
- A jar of dressing or sauce

## Assemble in five minutes

On a busy evening I put a grain, some vegetables and a protein in a bowl and add the sauce. Change the sauce and it is a completely different dinner.

## Keep it safe

Cool food quickly, store it in shallow containers, and eat cooked food within three or four days. Freeze anything you will not finish by then.

## The real benefit

The goal is not to eat perfectly. It is to remove the decision that makes you order takeaway at eight o'clock when you are tired. A fridge with good options makes the healthy choice the easy one.`,
    },
    {
      id: 'seed-dashboards',
      title: 'What Good Dashboards Get Right',
      cover: photo('1551288049-bebda4e38f71'),
      tags: ['Design', 'Data'],
      author: 'Mei Tanaka',
      status: 'published',
      date: '2026-08-20T13:00:00.000Z',
      likes: 33,
      content: `A dashboard is only useful if someone can look at it for five seconds and know whether things are fine. Most dashboards fail that test because they try to show everything.

## Start with the question

Before choosing any charts, write down the three questions the dashboard must answer. For a sales team it might be: are we on target, which product is moving, and where are we losing deals?

## Principles that hold up

1. **Put the most important number first**, large and with context such as change since last week
2. **Use the simplest chart that works.** Line charts for trends, bars for comparisons, tables for exact values
3. **Limit colour.** Reserve red and green for meaning, not decoration
4. **Label directly** instead of forcing people to match colours to a legend

## Things to avoid

- Pie charts with more than four slices
- Dual axes that make unrelated lines look correlated
- Animations that delay the moment you see the number

## Test it with a real person

Ask a colleague to say what they see in five seconds. If they cannot answer your three questions, remove something. A good dashboard is finished when there is nothing left to take away.`,
    },
    {
      id: 'seed-writing-daily',
      title: 'Writing Every Day for 30 Days: What Changed',
      cover: photo('1455390582262-044cdead277a'),
      tags: ['Writing', 'Productivity'],
      author: 'Amara Okafor',
      status: 'published',
      date: '2026-08-12T08:10:00.000Z',
      likes: 41,
      content: `Last month I wrote at least two hundred words every day for thirty days. Not polished articles, just honest practice. Here is what I noticed.

## The rules

- Write before checking messages
- Two hundred words minimum, no maximum
- No editing during the first draft
- Never skip two days in a row

## Week one was ugly

Most of what I wrote was complaining about having to write. That was fine. The habit mattered more than the content, and the pages got better once I stopped judging them.

## By week three

Ideas started arriving during the day. I carried a small notebook and wrote down phrases I wanted to use. Emails became shorter and clearer, because I had practised finding the point quickly.

## What I would tell a beginner

1. Pick a fixed time and place
2. Lower the bar until it feels almost silly
3. Keep a list of topics so you never start with a blank page
4. Share one piece a week with a friend

Writing is a skill that responds to repetition. Thirty days will not make you a novelist, but it will make you a person who writes, and that is a better place to start.`,
    },
    {
      id: 'seed-git-notes',
      title: 'Notes on Learning Git',
      cover: '',
      tags: ['Learning', 'Web Development'],
      author: 'Daniel Reyes',
      status: 'draft',
      date: '2026-10-01T09:00:00.000Z',
      likes: 0,
      content: `Rough notes for a future article about the Git commands I use every day.

## Commands to cover

- git status and git diff
- git log`,
    },
  ];

  const comments = [
    {
      id: 'seed-comment-1',
      postId: 'seed-portfolio',
      author: 'Daniel Reyes',
      text: 'The line about being able to explain a project in one sentence is gold. I wish I had heard this before starting my first app.',
      date: '2026-09-28T15:20:00.000Z',
    },
    {
      id: 'seed-comment-2',
      postId: 'seed-portfolio',
      author: 'Sofia Lindqvist',
      text: 'Great advice. I built a simple unit converter as my first project and it got me my first interview.',
      date: '2026-09-29T08:05:00.000Z',
    },
    {
      id: 'seed-comment-3',
      postId: 'seed-css-grid',
      author: 'Mei Tanaka',
      text: 'The auto-fit and minmax pattern replaced about forty lines of media queries in my last project.',
      date: '2026-09-25T10:40:00.000Z',
    },
    {
      id: 'seed-comment-4',
      postId: 'seed-async-js',
      author: 'Amara Okafor',
      text: 'Promise.all saved me so much loading time. Everyone should learn it early.',
      date: '2026-09-04T12:15:00.000Z',
    },
  ];

  Inkwell.seed = { posts, comments };
  Inkwell.covers = covers;
})((window.Inkwell = window.Inkwell || {}));