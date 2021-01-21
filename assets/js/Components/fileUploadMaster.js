import React from "react";

import { RenderFileNames } from "./renderFileNames";

class FileUploadMaster extends React.Component {
  state = {
    chunkSize: 16 * 1000, // Bytes
    files: {},
    filesBufferArr: [],
    fileNamesArr: [],
    remoteMasterPeersWebRtcConnections: [],
    dataChannelOptions: {
      ordered: true, // do not guarantee order
      // maxPacketLifeTime: 300, // in milliseconds
    },
  };

  componentDidMount() {
    const { remoteMasterPeersWebRtcConnections } = this.props;
    this.setState({ remoteMasterPeersWebRtcConnections });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      remoteMasterPeersWebRtcConnections:
        nextProps.remoteMasterPeersWebRtcConnections,
    });
  }

  handleChange = (event) => {
    const { chunkSize } = this.state;
    const inputElement = document.getElementById("masterFileUpload");
    if (inputElement.files && inputElement.files.length > 0) {
      let fileNamesArr = [];
      let files = {};
      for (const key in inputElement.files) {
        if (Object.hasOwnProperty.call(inputElement.files, key)) {
          const file = inputElement.files[key];
          fileNamesArr.push(file.name);
          const fileObj = {
            fileName: file.name,
            file,
            size: file.size,
            startSliceIndex: 0,
            endSliceIndex: chunkSize,
          };
          files[`file__${file.name}`] = fileObj;
          this.setState({
            files,
          });
        }
      }
      this.setState({ fileNamesArr });
    } else {
      console.log("No file selected");
    }
  };

  getChunkOfFile = async (fileName, file) => {
    const fileChunkPromise = new Promise((resolve, reject) => {
      const { files } = this.state;
      try {
        const slicedFilePart = file.slice(
          files[fileName].startSliceIndex,
          files[fileName].endSliceIndex
        );
        const fileReader = new FileReader();
        fileReader.addEventListener("load", async (event) => {
          let fileChunk = event.target.result;
          resolve(fileChunk);
        });
        fileReader.readAsArrayBuffer(slicedFilePart);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
    return await fileChunkPromise;
  };

  updateSliceIndexes = async (fileName) => {
    const updateIndexPromise = new Promise((resolve, reject) => {
      const { chunkSize, files } = this.state;
      files[fileName].startSliceIndex =
        files[fileName].startSliceIndex + chunkSize;
      files[fileName].endSliceIndex = files[fileName].endSliceIndex + chunkSize;
      this.setState(
        {
          files,
        },
        () => {
          resolve(`indexes updated for ${fileName}`);
        }
      );
    });

    return await updateIndexPromise;
  };

  createFileDataChannel = async (peerConnection, fileName) => {
    const { dataChannelOptions } = this.state;
    const dataChannelPromise = new Promise((resolve, reject) => {
      const dataChannel = peerConnection.createDataChannel(
        fileName,
        dataChannelOptions
      );

      dataChannel.onopen = () => {
        console.log(`${fileName} datachannel is open`);
        resolve({ dataChannel, peerConnection });
      };
      dataChannel.onerror = () => {
        console.log(`${fileName} datachannel has error`);
        reject(dataChannel);
      };
    });
    try {
      return await dataChannelPromise;
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  setupDataChannel = async (fileName, size) => {
    // If does not exist create one and send chunk
    const setupDataChannelPromise = new Promise(async (resolve, reject) => {
      const { remoteMasterPeersWebRtcConnections } = this.state;
      // Create data channels here in accordance to size of file
      let numberOfDataChannels = Math.ceil(size / 36000);
      if (numberOfDataChannels > 10) {
        numberOfDataChannels = 10;
      }
      try {
        const updatedRemoteMasterPeers = remoteMasterPeersWebRtcConnections.map(
          async (remoteMasterNodeObj) => {
            // Checking if file data channel already exists
            let isFileDataChannelExists = false;
            if (remoteMasterNodeObj.filesDataChannels) {
              if (remoteMasterNodeObj.filesDataChannels[fileName]) {
                isFileDataChannelExists = true;
              }
            }
            if (isFileDataChannelExists) {
              console.log("Datachannel already exists");
              return;
            } else {
              let dataChannelArr = [];
              let loopControlVariable = numberOfDataChannels;
              while (loopControlVariable > 0) {
                const {
                  dataChannel,
                  peerConnection,
                } = await this.createFileDataChannel(
                  remoteMasterNodeObj.peerConnection,
                  `${fileName}__${loopControlVariable}`
                );
                const fileDataChannelObj = {
                  dataChannel,
                  fileName,
                };
                dataChannelArr.push(fileDataChannelObj);
                remoteMasterNodeObj.peerConnection = peerConnection;
                loopControlVariable--;
              }
              if (!remoteMasterNodeObj.filesDataChannels) {
                remoteMasterNodeObj.filesDataChannels = {};
              }
              await Promise.all(dataChannelArr);
              remoteMasterNodeObj.filesDataChannels[fileName] = dataChannelArr;
            }
            return remoteMasterNodeObj;
          }
        );
        const resolvingPromises = await Promise.all(updatedRemoteMasterPeers);
        this.setState(
          {
            remoteMasterPeersWebRtcConnections: resolvingPromises,
          },
          () => {
            resolve(numberOfDataChannels);
          }
        );
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
    return await setupDataChannelPromise;
  };

  checkChunkResponse = async (
    fileNameSender,
    startSliceIndexSender,
    endSliceIndexSender,
    fileDataChannel
  ) => {
    const responsePromise = new Promise((resolve, reject) => {
      fileDataChannel.onmessage = (event) => {
        try {
          const responseObj = JSON.parse(event.data);
          const {
            startSliceIndex,
            endSliceIndex,
            fileName,
            masterPeerId,
            receiverd,
          } = responseObj;
          resolve(masterPeerId);
        } catch (error) {
          reject(error);
        }
      };
    });
    return await responsePromise;
  };

  sendChunkToSingleMaster = async (
    fileDataChannel,
    startSliceIndex,
    endSliceIndex,
    fileChunk,
    fileName,
    masterPeerId
  ) => {
    const sendMessageAndResponsePromise = new Promise(
      async (resolve, reject) => {
        fileDataChannel.send(
          JSON.stringify({
            startSliceIndex,
            endSliceIndex,
            fileName,
            masterPeerId,
          })
        );
        fileDataChannel.send(fileChunk);
        try {
          let chunkResponse = await this.checkChunkResponse(
            fileName,
            startSliceIndex,
            endSliceIndex,
            fileDataChannel
          );
          if (chunkResponse === masterPeerId) {
            resolve(chunkResponse);
          }
        } catch (error) {
          reject(error);
        }
      }
    );

    return await sendMessageAndResponsePromise;
  };

  sendFileChunkOverDataChannel = async (fileName, fileChunkToSend, counter) => {
    const sendFileChunkPromise = new Promise(async (resolve, reject) => {
      const { remoteMasterPeersWebRtcConnections, chunkSize } = this.state;
      try {
        const updatedRemoteMasterPeers = remoteMasterPeersWebRtcConnections.map(
          async (remoteMasterNodeObj) => {
            const hasFileDataChannels =
              remoteMasterNodeObj?.filesDataChannels || false;
            if (hasFileDataChannels) {
              let fileDataChannel =
                remoteMasterNodeObj.filesDataChannels[fileName][0].dataChannel;
              if (fileDataChannel.readyState !== "open") {
                const {
                  dataChannel,
                  peerConnection,
                } = await this.createFileDataChannel(
                  remoteMasterNodeObj.peerConnection,
                  fileName
                );
                const fileDataChannelObj = {
                  dataChannel,
                  fileName,
                };
                if (!remoteMasterNodeObj.filesDataChannels) {
                  remoteMasterNodeObj.filesDataChannels = {};
                }
                remoteMasterNodeObj.filesDataChannels[
                  fileName
                ] = fileDataChannelObj;
                remoteMasterNodeObj.peerConnection = peerConnection;
                fileDataChannel = dataChannel;
              }
              const startSliceIndex = counter;
              const endSliceIndex = counter + chunkSize;
              let retryCounter = 0;
              while (true) {
                try {
                  if (retryCounter > 5) {
                    break;
                  } else {
                    retryCounter = retryCounter + 1;
                  }
                  const remoteMasterId = await this.sendChunkToSingleMaster(
                    fileDataChannel,
                    startSliceIndex,
                    endSliceIndex,
                    fileChunkToSend,
                    fileName,
                    remoteMasterNodeObj.machine_id
                  );
                  if (remoteMasterId === remoteMasterNodeObj.machine_id) {
                    break;
                  } else {
                    console.error(
                      `Problem in sending chunk ${fileName} ${startSliceIndex} ${endSliceIndex} `
                    );
                  }
                } catch (error) {
                  console.error(`Problem in sending chunk ${error}`);
                  break;
                }
              }
            }
            return remoteMasterNodeObj;
          }
        );
        const resolvedPromises = await Promise.all(updatedRemoteMasterPeers);
        this.setState(
          {
            remoteMasterPeersWebRtcConnections: resolvedPromises,
          },
          () => {
            resolve(true);
          }
        );
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
    return await sendFileChunkPromise;
  };

  chunkAndUpdateIndex = async (fileName, file, counter) => {
    let fileChunkToSend = await this.getChunkOfFile(fileName, file);
    await this.sendFileChunkOverDataChannel(fileName, fileChunkToSend, counter);
    await this.updateSliceIndexes(fileName);
  };

  causeDelay = async () => {
    const delayPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, 300);
    });
    return await delayPromise;
  };

  distributeChunksForDataChannels = async (
    fileDataChannelName,
    totalDataChannels,
    eachDataChannelBytes
  ) => {
    const distributionChunkPromise = new Promise((resolve, reject) => {
      try {
        const { chunkSize } = this.state;
        const dataChannelBytesDistributionInfo = {};
        let eachBytesChunkEntrySize = 0;
        let byteControlVariable = eachDataChannelBytes;
        // In outer loop we will be adding an empty array of objects for each data channel
        for (let index = 0; index < totalDataChannels; index++) {
          dataChannelBytesDistributionInfo[
            `${fileDataChannelName}__${index + 1}`
          ] = [];
          // Here we will assign values to datachannel arrays
          while (eachBytesChunkEntrySize <= byteControlVariable) {
            const startSliceIndex = eachBytesChunkEntrySize;
            let endSliceIndex = eachBytesChunkEntrySize + chunkSize;
            if (endSliceIndex > byteControlVariable) {
              endSliceIndex = byteControlVariable;
            }
            dataChannelBytesDistributionInfo[
              `${fileDataChannelName}__${index + 1}`
            ].push({
              startSliceIndex,
              endSliceIndex,
            });
            eachBytesChunkEntrySize = eachBytesChunkEntrySize + chunkSize;
          }
          eachBytesChunkEntrySize = byteControlVariable;
          byteControlVariable = byteControlVariable + eachDataChannelBytes;
        }
        resolve(dataChannelBytesDistributionInfo);
      } catch (error) {
        reject(error);
      }
    });
    return await distributionChunkPromise;
  };

  getSpecificChunkOfFile = async (fileName, startSliceIndex, endSliceIndex) => {
    const fileChunkPromise = new Promise((resolve, reject) => {
      const { files } = this.state;
      try {
        const file = files[fileName].file;
        const slicedFilePart = file.slice(startSliceIndex, endSliceIndex);
        const fileReader = new FileReader();
        fileReader.addEventListener("load", async (event) => {
          let fileChunk = event.target.result;
          resolve(fileChunk);
        });
        fileReader.readAsArrayBuffer(slicedFilePart);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
    return await fileChunkPromise;
  };

  sendChunksDistributedly = async (
    fileName,
    fileDataChannel,
    chunkIndexesArr = [],
    remoteNodeId
  ) => {
    console.log("chunkIndexesArr.length: ", chunkIndexesArr.length);
    const sendingChunkPromise = new Promise((resolve, reject) => {
      chunkIndexesArr.map(async ({ startSliceIndex, endSliceIndex }, i) => {
        console.count(i);
        try {
          const fileChunkToSend = await this.getSpecificChunkOfFile(
            fileName,
            startSliceIndex,
            endSliceIndex
          );

          let retryCounter = 0;
          while (true) {
            try {
              if (retryCounter > 5) {
                break;
              } else {
                retryCounter = retryCounter + 1;
              }
              const remoteMasterId = await this.sendChunkToSingleMaster(
                fileDataChannel,
                startSliceIndex,
                endSliceIndex,
                fileChunkToSend,
                fileName,
                remoteNodeId
              );
              if (remoteMasterId === remoteNodeId) {
                break;
              } else {
                const errorMessage = `Problem in sending chunk ${fileName} ${startSliceIndex} ${endSliceIndex} `;
                console.error(errorMessage);
                reject(errorMessage);
              }
            } catch (error) {
              console.error(`Problem in sending chunk ${error}`);
              reject(error);

              break;
            }
          }
          resolve(true);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    });
    return await sendingChunkPromise;
  };

  setupChunksWithFileDataChannels = async (
    fileDataChannelName,
    distributionFileChunksInfo
  ) => {
    const sendFilePromise = new Promise((resolve, reject) => {
      const { remoteMasterPeersWebRtcConnections } = this.state;
      remoteMasterPeersWebRtcConnections.map(async (remoteMasterNodeObj) => {
        const allFilesDataChannels =
          remoteMasterNodeObj?.filesDataChannels || false;
        if (!allFilesDataChannels) {
          // Termiante here with not datachannel error
          alert("No Data Channel Found");
          reject("No data channel found");
        } else {
          try {
            const currentFileDataChannelsArr =
              allFilesDataChannels[fileDataChannelName];
            currentFileDataChannelsArr.map(
              async ({ dataChannel, fileName }) => {
                const { label } = dataChannel;
                const distributeChunksArr = distributionFileChunksInfo[label];
                await this.sendChunksDistributedly(
                  fileDataChannelName,
                  dataChannel,
                  distributeChunksArr,
                  remoteMasterNodeObj.machine_id
                );
              }
            );
            resolve(true);
          } catch (error) {
            console.error(error);
            reject(error);
          }
        }
      });
    });
    return await sendFilePromise;
  };

  createAndSendChunksOfFile = async ({ fileName, file, size }) => {
    const createAndSendChunksPromise = new Promise(async (resolve, reject) => {
      try {
        const { chunkSize } = this.state;
        let counter = 0;
        let counterHelper = 0;
        const fileDataChannelName = `file__${fileName}`;
        // We get how many datachannels will be created for each file
        const numberOfDataChannels = await this.setupDataChannel(
          fileDataChannelName,
          size
        );
        // Here we will calculate how many bytes each data channel will send
        const numberOfChunkArrForEachDataChannel = Math.ceil(
          size / numberOfDataChannels
        );
        // Here we will create an array for each datachannel to send
        const distributionFileChunksInfo = await this.distributeChunksForDataChannels(
          fileDataChannelName,
          numberOfDataChannels,
          numberOfChunkArrForEachDataChannel
        );
        await this.setupChunksWithFileDataChannels(
          fileDataChannelName,
          distributionFileChunksInfo
        );

        // while (counter < size) {
        //   try {
        //     // await this.causeDelay();
        //     await this.chunkAndUpdateIndex(fileDataChannelName, file, counter);
        //     counter = counter + chunkSize;
        //     console.log(counter / 1000000);
        //     counterHelper = counterHelper + 1;
        //     console.log("counterHelper: ", counterHelper);
        //   } catch (error) {
        //     console.error(error);
        //     reject(error);
        //     break;
        //   }
        // }
        resolve(true);
        console.log("While loop end");
      } catch (error) {
        reject(error);
      }
    });
    return await createAndSendChunksPromise;
  };

  handleFilesToMasters = async (event) => {
    const { files } = this.state;
    if (Object.keys(files).length > 0) {
      for (const key in files) {
        if (Object.hasOwnProperty.call(files, key)) {
          const fileObj = files[key];
          await this.createAndSendChunksOfFile(fileObj);
        }
      }
    }
  };
  cleanIndexedDb = async () => {
    await window.indexedDB
      .databases()
      .then((r) => {
        for (var i = 0; i < r.length; i++)
          window.indexedDB.deleteDatabase(r[i].name);
      })
      .then(() => {
        alert("All data cleared.");
      });
  };
  render() {
    const { fileNamesArr } = this.state;
    return (
      <div>
        <div className="custom-file mt-2 mb-2">
          <input
            type="file"
            className="custom-file-input"
            onChange={this.handleChange}
            id="masterFileUpload"
            multiple
          />
          <label className="custom-file-label" htmlFor="masterFileUpload">
            Choose files
          </label>
        </div>
        <RenderFileNames fileNamesArr={fileNamesArr} />
        <div>
          <button
            className="btn btn-outline-light m-2"
            // onClick={this.handleFilesToChilds}
          >
            Send Files To Child
          </button>
          <button
            className="btn btn-outline-light m-2"
            onClick={this.handleFilesToMasters}
          >
            Send Files To Masters
          </button>

          <button
            className="btn btn-outline-light m-2"
            onClick={this.cleanIndexedDb}
          >
            Clean IndexedDb
          </button>
        </div>
      </div>
    );
  }
}

export default FileUploadMaster;
