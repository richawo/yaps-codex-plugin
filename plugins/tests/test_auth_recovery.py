from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = (
    REPO_ROOT
    / "plugins"
    / "yaps-transcription"
    / "scripts"
    / "transcribe_with_yaps.py",
    REPO_ROOT
    / "plugins"
    / "yaps-meeting-transcription"
    / "scripts"
    / "transcribe_meeting_with_yaps.py",
)


def load_script(path: Path, index: int):
    spec = importlib.util.spec_from_file_location(f"yaps_plugin_{index}", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PluginAuthRecoveryTests(unittest.TestCase):
    def test_retries_recommended_settings_path(self) -> None:
        for index, script in enumerate(SCRIPTS):
            with self.subTest(script=script.name):
                module = load_script(script, index)
                calls: list[list[str]] = []
                responses = iter(
                    (
                        {
                            "authenticated": False,
                            "status": "settings_path_mismatch",
                            "recommended_settings_path": "/canonical/settings.json",
                        },
                        {"authenticated": True, "status": "active"},
                    )
                )

                def fake_run(command: list[str], _message: str):
                    calls.append(command)
                    return next(responses)

                module.run_json = fake_run
                selected = module.ensure_active_account(Path("/opt/yaps_cli"))

                self.assertEqual(selected, Path("/canonical/settings.json"))
                self.assertEqual(
                    calls[1][1:3],
                    ["--settings-path", "/canonical/settings.json"],
                )

    def test_explains_credential_store_failure_without_account_switch(self) -> None:
        for index, script in enumerate(SCRIPTS):
            with self.subTest(script=script.name):
                module = load_script(script, index)
                module.run_json = lambda *_args: {
                    "authenticated": False,
                    "status": "credential_unavailable",
                    "diagnostic_code": "keychain_unavailable",
                }

                with self.assertRaisesRegex(RuntimeError, "credential store") as raised:
                    module.ensure_active_account(Path("/opt/yaps_cli"))

                self.assertIn(
                    "emails do not need to match",
                    str(raised.exception),
                )


if __name__ == "__main__":
    unittest.main()
