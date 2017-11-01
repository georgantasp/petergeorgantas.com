var AWS = require('aws-sdk');
var s3 = require('s3');

AWS.config.update({region: 'us-east-1'});

var cloudformation = new AWS.CloudFormation();
var client = s3.createClient({s3Client: new AWS.S3()});

var prefix = process.env.CODEBUILD_BUILD_ID || 'dev';

async function deployCloudformation() {
  var params = {
    StackName: "petergeorgantascom",
    TemplateBody: fs.readFileSync('template.yml', 'utf8'),
    Parameters: [{
      ParameterKey: 'OriginPath',
      ParameterValue: prefix
    }]
  }

  await new Promise((resolve, reject) =>
    cloudformation.updateStack(params, function(err, data) {
      if (err) reject(err);
      else     resolve(data);
    })
  );
} 

async function deployS3(){
  var params = {
    localDir: 'public',
    deleteRemoved: true,
    s3Params: {
      Bucket: 'petergeorgantas.com',
      Prefix: prefix
    }
  };
  
  await new Promise((resolve, reject) => {
    var uploader = client.uploadDir(params);
    uploader.on('error', function(err) {
      reject(err);
    });
    uploader.on('progress', function() {
      console.log("progress", uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
      resolve();
    });
  });
}

async function deploy() {
  console.log('updating cloudformation');
  await deployCloudformation();
  
  console.log('updating s3');
  await deployS3();
}

deploy();
