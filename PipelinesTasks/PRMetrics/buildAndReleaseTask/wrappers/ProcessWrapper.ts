class ProcessWrapper {
    public log(input: string) {
        process.stdout.write(input);
    }
}

export default ProcessWrapper;
