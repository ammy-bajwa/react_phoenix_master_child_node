import React from "react";

export const RenderFileNames = ({ fileNamesArr = [] }) => {
  return (
    <div className="d-flex flex-wrap">
      {fileNamesArr.length > 0 &&
        fileNamesArr.map((fileName, i) => (
          <div className="card bg-info text-white m-3" key={i}>
            <div className="card-body text-center">
              <p className="card-text">{fileName}</p>
            </div>
          </div>
        ))}
    </div>
  );
};
