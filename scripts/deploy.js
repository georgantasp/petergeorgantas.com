var fs = require('fs');
var AWS = require('aws-sdk');
var S3 = require('aws-sdk/clients/s3');

AWS.config.update({region: 'us-east-1'});

var cloudformation = new AWS.CloudFormation();
var client = new AWS.S3();

var originPath = process.env.CODEBUILD_BUILD_ID || 'dev';

function deployCloudformation() {
  console.log('updating cloudformation');
  
  var params = {
    StackName: "petergeorgantascom",
    TemplateBody: fs.readFileSync('template.yml', 'utf8'),
    Parameters: [{
      ParameterKey: 'OriginPath',
      ParameterValue: originPath
    }]
  }

  return new Promise((resolve, reject) =>
    cloudformation.updateStack(params, function(err, data) {
      if (err) reject(err);
      else     resolve(data);
    })
  );
} 

function deployS3(){
  console.log('updating s3');
  
  var params = {
    localDir: 'public',
    deleteRemoved: true,
    s3Params: {
      Bucket: 'petergeorgantas.com',
      Prefix: originPath
    }
  };
  
  return new Promise((resolve, reject) => {
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

function handleError(err){
  console.error(err);
  process.exit(1);
}

deployCloudformation().catch(handleError).then(deployS3).catch(handleError);
