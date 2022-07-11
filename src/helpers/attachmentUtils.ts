import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)


export class AttachmentUtils {
    constructor(
        // private readonly docClient: DocumentClient = docClient,
        // private readonly todosTable = todosTable,
        private readonly s3 = new XAWS.S3({
            signatureVersion: 'v4'
        }),
        private readonly bucketName = process.env.S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
    ) {
    }

    getAttachmentUrl(imageId: string) {
        return `https://${this.bucketName}.s3.amazonaws.com/${imageId}`
    }

    async getPresignedUrl(attachmentId: string): Promise<string> {
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: attachmentId,
            Expires: parseInt(this.urlExpiration)
        })
    }
}