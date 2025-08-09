const fs = require("fs");
const process = require("process");
const {
  TextractClient,
  AnalyzeDocumentCommand,
} = require("@aws-sdk/client-textract");
const parseProximity = require("./parsers/parseProximity").parseProximity;
const aiFormatter = require("./parsers/aiFormatter").aiFormatter
// const parseProximity = require('./parsers/proximityParser').parseProximity;

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const processFile = async (receiptPath) => {
  const receiptBytes = fs.readFileSync(receiptPath);
  const params = {
    Document: { Bytes: receiptBytes },
    FeatureTypes: ["TABLES"],
  };
  const command = new AnalyzeDocumentCommand(params);
  const response = await textractClient.send(command);

  const blocks = response.Blocks || [];
  // const proximityReturn = parseProximity(blocks);
  const startProximity = Date.now();
  const parseRecieptReturn = parseProximity(blocks);
  const endProximity = Date.now();
  console.log(`parseProximity took ${endProximity - startProximity} ms`);

  const startAI = Date.now();
  const aiFormatted = await aiFormatter(parseRecieptReturn);
  const endAI = Date.now();
  console.log(`aiFormatter took ${endAI - startAI} ms`);

  // console.log(aiFormatted, "return aiFormatter");
  return aiFormatted;
};

module.exports = {
  processFile,
};
