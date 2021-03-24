
export default class CommentData {
  private _isPresent: boolean = false
  private _threadId: number | null = null
  private _commentId: number | null = null
  private _ignoredFilesWithLinesAdded: string[] = []
  private _ignoredFilesWithoutLinesAdded: string[] = []

  public constructor (ignoredFilesWithLinesAdded: string[], ignoredFilesWithoutLinesAdded: string[]) {
    this._ignoredFilesWithLinesAdded = ignoredFilesWithLinesAdded
    this._ignoredFilesWithoutLinesAdded = ignoredFilesWithoutLinesAdded
  }

  public get isPresent (): boolean {
    return this._isPresent
  }

  public set isPresent (value: boolean) {
    this._isPresent = value
  }

  public get threadId (): number | null {
    return this._threadId
  }

  public set threadId (value: number | null) {
    this._threadId = value
  }

  public get commentId (): number | null {
    return this._commentId
  }

  public set commentId (value: number | null) {
    this._commentId = value
  }

  public get ignoredFilesWithLinesAdded (): string[] {
    return this._ignoredFilesWithLinesAdded
  }

  public set ignoredFilesWithLinesAdded (value: string[]) {
    this._ignoredFilesWithLinesAdded = value
  }

  public get ignoredFilesWithoutLinesAdded (): string[] {
    return this._ignoredFilesWithoutLinesAdded
  }

  public set ignoredFilesWithoutLinesAdded (value: string[]) {
    this._ignoredFilesWithoutLinesAdded = value
  }
}
