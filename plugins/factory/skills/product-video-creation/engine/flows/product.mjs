// Scene 3: the real product, driven live. node record.mjs product
// `p` is the flow API from record.mjs: say, settle, click, type, press, hover,
// scroll, wait, goto, and `p.page` for anything else Playwright can do.
export const options = {
  url: 'http://localhost:8080',   // the running product, already loaded when recording starts
  // viewport: { width: 1440 },   // CSS width; the video is always 1920×1080
  // colorScheme: 'light',
  // prepare: async (page) => {},  // seed data, log in, dismiss banners: all before the first frame
};

export default async function flow(p) {
  await p.say('s3_intro');
  await p.wait(0.6);
  // await p.type('Order coffee beans', { target: 'input[name=title]' });
  // await p.press('Enter');
  // await p.settle();
}
