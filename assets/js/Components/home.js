import React from "react";

class Home extends React.Component {
  state = {};
  constructor(props) {
    super(props);
  }

  componentDidMount() {}

  createNewButton = () => {
    const newButton = document.createElement("button");
    const componentThis = this;
    newButton.innerText = "new button";
    newButton.onclick = (event) => {
      console.log("newButton.onclick");
      componentThis.testFun();
    };
    return newButton;
  };

  handleCreateButton = () => {
    const newButton = this.createNewButton();
    // document.querySelector("#newButtonDiv").append(newButton);
    this.setState({
      newButton,
    });
  };

  handleExecutionEventInState = () => {
    const { newButton } = this.state;
    newButton.click();
  };
  render() {
    return (
      <div>
        <button onClick={this.handleCreateButton}>add button</button>
        <button onClick={this.handleExecutionEventInState}>
          execute click button
        </button>
        <div id="newButtonDiv"></div>
      </div>
    );
  }
}

export default Home;
