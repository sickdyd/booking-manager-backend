"use strict";
const error = require("./error");

describe("middleware/error.js", () => {

  it("should return 500 in case of error", () => {

    let res;
    let resSend;
    let resStatus;
  
    function setUpExpressMocks() {
        resStatus = jest.fn();
        resSend = jest.fn();
        res = {
            send: resSend,
            status: resStatus,
        };
        resStatus.mockImplementation(() => res);
        resSend.mockImplementation(() => res);
    }
  
    setUpExpressMocks();
  
    const err = new Error("Testing error 500.");
    error(err, {}, res, ()=>{});
    expect(resStatus).toHaveBeenCalledWith(500);
    
  });
});