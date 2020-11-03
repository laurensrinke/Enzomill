export const getWrappedText = (text) => {
  return { __html: text.replace(/(?:\r\n|\r|\n)/g, "<br/>") };
};
