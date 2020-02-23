export class VerificationData {
    readonly kind: string
    status: boolean
    title: string

    constructor(status: boolean, title: string) {
        this.kind = 'VerificationData'
        this.status = status
        this.title = title
    }
}