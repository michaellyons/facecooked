# face-api.js API Documentation (minimized)

## Index

- **Enumerations**
  - TinyYolov2SizeType

- **Classes**
  - BoundingBox
  - Box
  - BoxWithText
  - ComposableTask
  - ComputeAllFaceDescriptorsTask
  - ComputeFaceDescriptorsTaskBase
  - ComputeSingleFaceDescriptorTask
  - DetectAllFaceLandmarksTask
  - DetectAllFacesTask
  - DetectFaceLandmarksTaskBase
  - DetectFacesTaskBase
  - FaceLandmark68TinyNet
  - FaceLandmarkNet
  - FaceLandmarks
  - FaceLandmarks5
  - FaceLandmarks68
  - FaceMatch
  - FaceMatcher
  - FaceProcessor
  - FaceRecognitionNet
  - LabeledBox
  - LabeledFaceDescriptors
  - Mtcnn
  - MtcnnOptions
  - NetInput
  - NeuralNetwork
  - ObjectDetection
  - Point
  - SsdMobilenetv1
  - TinyFaceDetector
  - TinyFaceDetectorOptions

- **Type Aliases**
  - FaceDetectionOptions: TinyFaceDetectorOptions | SsdMobilenetv1Options | MtcnnOptions | TfjsImageRecognitionBase.TinyYolov2Options
  - FaceExpression: "neutral" | "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised"
  - FaceExpressionPrediction: object

- **Functions**
  - createSsdMobilenetv1(weights: Float32Array): SsdMobilenetv1
  - createFaceRecognitionNet(weights: Float32Array): FaceRecognitionNet
  - createFileSystem(fs?: any): FileSystem
  - getMediaDimensions(input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | IDimensions): Dimensions
  - imageTensorToCanvas(imgTensor: tf.Tensor, canvas?: HTMLCanvasElement): Promise<HTMLCanvasElement>
  - tinyYolov2
  - toNetInput

- **Object Literals**
  - env
  - faceExpressionLabels
  - nets

## Legend

- **Module**: Module
- **Object literal**: Object literal
- **Variable**: Variable
- **Function**: Function
- **Type alias**: Type alias
- **Enumeration**: Enumeration
- **Class**: Class
- **Interface**: Interface

For more details, see the full HTML documentation or the [TypeDoc](http://typedoc.org/) generated site.
