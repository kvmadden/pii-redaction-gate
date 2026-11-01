"""Run baseline, dependency and candidate gates in a disposable clone."""
import os
import pathlib
import shutil
import subprocess
import tempfile

current = pathlib.Path(__file__).resolve().parents[3]
evidence = current / 'docs/evidence/inspector'
repo = '/Users/kevin/dev/repos/pii-redaction-gate'
env = os.environ.copy()
env.pop('MFW_UMBRELLA_ROOT', None)
env.pop('OPERATOR_ECOSYSTEM_ROOT', None)
with tempfile.TemporaryDirectory(prefix='pii-inspector-control-') as tmp:
    clone = pathlib.Path(tmp) / 'repo'
    subprocess.run(['git', 'clone', '--no-local', repo, str(clone)], check=True, capture_output=True)
    for revision, label in [('origin/main', 'control-full'), ('origin/grok/pii-redaction-gate-upgrade', 'dependency-full')]:
        subprocess.run(['git', 'checkout', '--detach', revision], cwd=clone, check=True, capture_output=True)
        result = subprocess.run(['npm', 'test'], cwd=clone, env=env, capture_output=True, text=True)
        (evidence / (label + '.txt')).write_text(result.stdout + result.stderr)
        print(label, 'exit', result.returncode)
        assert result.returncode == 0
    paths = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=current, text=True).splitlines()
    for name in paths:
        if name.startswith(('docs/evidence/', 'docs/media/')):
            continue
        source = current / name
        if source.is_file():
            target = clone / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
    result = subprocess.run(['npm', 'test'], cwd=clone, env=env, capture_output=True, text=True)
    (evidence / 'fresh-candidate-full.txt').write_text(result.stdout + result.stderr)
    print('fresh-candidate-full exit', result.returncode)
    assert result.returncode == 0
