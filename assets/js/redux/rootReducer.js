const initialState = {
  allRowData: Array.from(Array(100).keys()),
  inView: Array.from(Array(30).keys()),
  startIndex: 0,
  endIndex: 30,
  lastScrollTop: 0,
  data: [],
};

export const tableReducer = (state = initialState, action) => {
  console.log(action);
  switch (action.type) {
    case "SET_ALL_DATA":
      return {
        ...state,
        data: action.payload,
        inView: action.payload.length,
      };
    case "SET_SINGLE_USER":
      console.log("working");
      return {
        ...state,
        data: [...state.data, action.payload],
      };
    case "SET_ALL_ROW_DATA":
      return {
        ...state,
        allRowData: action.payload,
      };

    case "SET_INVIEW_ROW_DATE":
      return {
        ...state,
        inView: action.payload,
      };

    case "SET_START_INDEX":
      return {
        ...state,
        startIndex: action.payload,
      };

    case "SET_END_INDEX":
      return {
        ...state,
        endIndex: action.payload,
      };

    case "SCROLL_DOWN":
      const { inView, allRowData, startIndex, endIndex } = state;
      let updatedStartIndex = startIndex + 1;
      let updatedEndIndex = endIndex + 1;
      if (updatedEndIndex >= allRowData.length) {
        return state;
      } else {
        let updatedInview = inView;
        updatedInview.shift();
        updatedInview.push(allRowData[updatedEndIndex]);

        return {
          ...state,
          startIndex: updatedStartIndex,
          endIndex: updatedEndIndex,
          inView: updatedInview,
        };
      }
    case "SCROLL_UP":
      let updatedStartIndexUp = state.startIndex - 1;
      let updatedEndIndexUp = state.endIndex - 1;
      if (updatedStartIndexUp + 1 <= 0) {
        return state;
      } else {
        let updatedInviewUp = state.inView;
        updatedInviewUp.unshift(state.allRowData[updatedStartIndexUp]);
        updatedInviewUp.pop();

        return {
          ...state,
          startIndex: updatedStartIndexUp,
          endIndex: updatedEndIndexUp,
          inView: updatedInviewUp,
        };
      }
    default:
      return state;
  }
};
