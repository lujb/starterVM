requirejs.config({
    // baseUrl: 'lib',
    paths: {
        app: 'app',
        asm: 'lib/asm',
        kernel: 'lib/kernel'
    }
});

requirejs(['app/main']);
