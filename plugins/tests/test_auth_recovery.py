from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
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
    def test_python_helpers_use_the_shared_validated_resolver(self) -> None:
        with tempfile.TemporaryDirectory(prefix="yaps-cli-helper-") as root:
            cli = Path(root) / "yaps cli; no shell"
            cli.write_text(
                "#!/usr/bin/env node\n"
                "process.stdout.write(JSON.stringify({settings_path:'/settings',"
                "settings_exists:true,auth_store_path:'/auth',models_dir:'/models'}));\n",
                encoding="utf-8",
            )
            cli.chmod(0o755)
            for index, script in enumerate(SCRIPTS):
                with self.subTest(script=script.name):
                    module = load_script(script, index + 100)
                    self.assertEqual(module.resolve_cli(str(cli)), cli)

    def test_python_helpers_reject_a_non_yaps_override(self) -> None:
        with tempfile.TemporaryDirectory(prefix="not-yaps-cli-") as root:
            candidate = Path(root) / "yaps_cli"
            candidate.write_text(
                "#!/usr/bin/env node\nprocess.stdout.write('{}');\n",
                encoding="utf-8",
            )
            candidate.chmod(0o755)
            for index, script in enumerate(SCRIPTS):
                with self.subTest(script=script.name):
                    module = load_script(script, index + 200)
                    with self.assertRaisesRegex(RuntimeError, "safe status check"):
                        module.resolve_cli(str(candidate))

    def test_uses_settings_path_already_recovered_by_shared_resolver(self) -> None:
        for index, script in enumerate(SCRIPTS):
            with self.subTest(script=script.name):
                module = load_script(script, index)
                selected = module.ensure_active_account(
                    Path("/opt/yaps_cli"),
                    {
                        "authenticated": True,
                        "account_status": "active",
                        "settings_path": "/canonical/settings.json",
                    },
                )

                self.assertEqual(selected, Path("/canonical/settings.json"))

    def test_helpers_use_the_already_recovered_session_without_another_probe(self) -> None:
        for index, script in enumerate(SCRIPTS):
            with self.subTest(script=script.name):
                module = load_script(script, index + 300)

                def unexpected_run(*_args):
                    raise AssertionError("the shared session should avoid another auth probe")

                module.run_json = unexpected_run
                selected = module.ensure_active_account(
                    Path("/opt/yaps_cli"),
                    {
                        "authenticated": True,
                        "account_status": "active",
                        "settings_path": "/canonical/settings.json",
                        "diagnostic_code": None,
                    },
                )

                self.assertEqual(selected, Path("/canonical/settings.json"))

    def test_old_credential_flow_requires_an_update_not_keychain_approval(self) -> None:
        for index, script in enumerate(SCRIPTS):
            with self.subTest(script=script.name):
                module = load_script(script, index)
                with self.assertRaisesRegex(RuntimeError, "Update Yaps") as raised:
                    module.ensure_active_account(
                        Path("/opt/yaps_cli"),
                        {
                            "authenticated": False,
                            "account_status": "credential_unavailable",
                            "diagnostic_code": "keychain_unavailable",
                        },
                    )

                self.assertIn("Do not approve a Keychain prompt", str(raised.exception))
                self.assertNotIn("Always Allow", str(raised.exception))
                self.assertIn(
                    "emails do not need to match",
                    str(raised.exception),
                )

    def test_inactive_account_does_not_trigger_a_billing_credential_check(self) -> None:
        for index, script in enumerate(SCRIPTS):
            with self.subTest(script=script.name):
                module = load_script(script, index)
                with self.assertRaisesRegex(RuntimeError, "account screen"):
                    module.ensure_active_account(
                        Path("/opt/yaps_cli"),
                        {"authenticated": False, "account_status": "expired"},
                    )

    def test_shared_safe_version_diagnosis_is_preserved_exactly(self) -> None:
        for index, script in enumerate(SCRIPTS):
            for code, safety in (
                ("account_status_unsafe", "unsafe"),
                ("account_status_unverified", "unknown"),
            ):
                with self.subTest(script=script.name, code=code):
                    module = load_script(script, index + 400)
                    message = f"safe resolver guidance for {code}; do not inspect billing"
                    with self.assertRaisesRegex(RuntimeError, message) as raised:
                        module.ensure_active_account(
                            Path("/opt/yaps_cli"),
                            {
                                "authenticated": False,
                                "account_status": "unknown",
                                "account_code": code,
                                "account_message": message,
                                "auth_status_safety": safety,
                            },
                        )
                    self.assertEqual(str(raised.exception), message)


if __name__ == "__main__":
    unittest.main()
