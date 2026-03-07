const CREDENTIALS = process.env.AWS_CREDENTIALS;
const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_BUCKET_NAME;
const {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
} = "@aws-sdk/client-s3";

const s3Client = new S3Client({ REGION, CREDENTIALS });




async function uploadOne(key, buffer, mime, options, callback) {
	const useBucket = 'bucket' in options ? options.bucket : BUCKET;
	try {
	
		await s3Client.send(
			new PutObjectCommand({
				Bucket: useBucket,
				Key: key,
				Body: buffer,
				ContentType: mime,
			}),
		);
	
		const response = await s3Client.send(
			new GetObjectCommand({
				Bucket: useBucket,
				Key: key,
			}),
		);

		return callback 
			? callback(response, null)
			: response.metadata;

	} catch (err) {
		if (callback) return callback(null, err)
		else throw new Error(err);
	}
}


async function getOne(key, options, callback) {
	const useBucket = 'bucket' in options ? options.bucket : BUCKET;
	try {	
		const { Body, metadata } = await s3Client.send(
			new GetObjectCommand({
				Bucket: useBucket,
				Key: key,
			}),
		);
		const result = { Body, ...metadata }

		return callback 
			? callback(result, null)
			: result;

	} catch (err) {
		if (callback) return callback(null, err)
		else throw new Error(err);
	}
}


async function destroyOne(key, options, callback) {
	const useBucket = 'bucket' in options ? options.bucket : BUCKET;
	try {
		await s3Client.send(
			new DeleteObjectCommand({ 
				Bucket: useBucket, 
				Key: key 
			}),
		);

		return callback 
			? callback(null, null)
			: true;

	} catch (err) {
		if (callback) return callback(null, err)
		else throw new Error(err);
	}
}

async function destroyMany(keys, options, callback) {
	const useBucket = 'bucket' in options ? options.bucket : BUCKET;
	const result = [];
	try {
		const paginator = paginateListObjectsV2(
			{ client: s3Client },
			{ Bucket: BUCKET },
		);

		for await (const page of paginator) {
			const objects = page.Contents;
			if (objects) {
				for (const object of objects) {
					if (keys.findIndex(object.Key)) {
						await s3Client.send(
							new DeleteObjectCommand({ 
								Bucket: useBucket, 
								Key: object.Key 
							}),
						);
						result.push(object.Key);
		}	}	}	}

		return callback 
			? callback(result, null)
			: result;

	} catch (err) {
		if (callback) return callback(result, err)
		else throw new Error(err);
	}
}


module.exports = {
	uploadOne,
	getOne,
	deleteOne, deleteMany,
}