export const setAllRowData = (payload) => ({
  type: "SET_ALL_ROW_DATA",
  payload,
});

export const setSignleUser = (payload) => ({
  type: "SET_SINGLE_USER",
  payload,
});

export const setInViewRowData = (payload) => ({
  type: "SET_INVIEW_ROW_DATE",
  payload,
});

export const setStartIndex = (payload) => ({
  type: "SET_START_INDEX",
  payload,
});

export const setEndIndex = (payload) => ({
  type: "SET_END_INDEX",
  payload,
});

export const scrollDown = () => ({
  type: "SCROLL_DOWN",
});

export const scrollUp = () => ({
  type: "SCROLL_UP",
});
