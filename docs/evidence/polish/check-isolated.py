"""Compare untouched main and candidate in a disposable temporary clone."""
import os
import pathlib
import shutil
import subprocess
import tempfile

current = pathlib.Path(__file__).resolve().parents[3]
evidence = current / 'docs/evidence/polish'
# Drop every *_ROOT variable, so nothing points the clone at another checkout.
env = {key: value for key, value in os.environ.items() if not key.endswith('_ROOT')}
with tempfile.TemporaryDirectory(prefix='pii-polish-control-', dir='/tmp') as tmp:
    subprocess.run(['git', 'clone', '--no-local', str(current), tmp], check=True, capture_output=True)
    subprocess.run(['git', 'checkout', '--detach', '63ac3abc48094e86f6883f99c1586b45bf6ebd3f'], cwd=tmp, check=True, capture_output=True)
    for label in ['control-full', 'fresh-candidate-full']:
        if label == 'fresh-candidate-full':
            paths = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=current, text=True).splitlines()
            for name in paths:
                if name.startswith(('docs/evidence/', 'docs/media/')):
                    continue
                source = current / name
                if source.is_file():
                    target = pathlib.Path(tmp) / name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(source, target)
        result = subprocess.run(['npm', 'test'], cwd=tmp, env=env, capture_output=True, text=True)
        (evidence / (label + '.txt')).write_text(result.stdout + result.stderr + '\nexit=' + str(result.returncode) + '\n')
        print(label, 'exit', result.returncode)
        assert result.returncode == 0
