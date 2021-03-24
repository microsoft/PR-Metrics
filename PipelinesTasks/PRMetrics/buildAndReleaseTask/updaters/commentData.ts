
export default interface CommentData {
  isPresent: boolean
  threadId: number
  commentId: number
  ignoredFilesWithLinesAdded: string[]
  ignoredFilesWithoutLinesAdded: string[]
}
