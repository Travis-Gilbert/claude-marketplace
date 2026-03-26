from django.db import migrations, models
import django.db.models.deletion
import django.db.models.manager


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Plugin",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("slug", models.SlugField(max_length=100, unique=True)),
                ("name", models.CharField(max_length=200)),
                ("version", models.CharField(default="1.0.0", max_length=20)),
                ("description", models.TextField(blank=True)),
                ("claude_md", models.TextField(blank=True, help_text="Full CLAUDE.md content")),
                ("agents_md", models.TextField(blank=True, help_text="Full AGENTS.md content")),
                ("manifest", models.JSONField(blank=True, default=dict, help_text="Contents of .claude-plugin/plugin.json")),
            ],
            options={
                "ordering": ["name"],
            },
            managers=[
                ("objects", django.db.models.manager.Manager()),
                ("all_objects", django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name="IngestionRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("commit_sha", models.CharField(max_length=40)),
                ("status", models.CharField(choices=[("running", "Running"), ("completed", "Completed"), ("failed", "Failed")], max_length=20)),
                ("plugins_synced", models.IntegerField(default=0)),
                ("chunks_created", models.IntegerField(default=0)),
                ("embeddings_generated", models.IntegerField(default=0)),
                ("error_log", models.TextField(blank=True)),
                ("duration_seconds", models.FloatField(blank=True, null=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
            managers=[
                ("objects", django.db.models.manager.Manager()),
                ("all_objects", django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name="Template",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("slug", models.SlugField(max_length=200)),
                ("name", models.CharField(max_length=300)),
                ("category", models.CharField(help_text="Template subdirectory", max_length=100)),
                ("file_path", models.CharField(max_length=500)),
                ("content", models.TextField()),
                ("language", models.CharField(default="python", max_length=30)),
                ("plugin", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="templates", to="plugins.plugin")),
            ],
            options={
                "unique_together": {("plugin", "file_path")},
            },
            managers=[
                ("objects", django.db.models.manager.Manager()),
                ("all_objects", django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name="SourceChunk",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("file_path", models.CharField(db_index=True, help_text="Path relative to plugin root", max_length=500)),
                ("ref_library", models.CharField(db_index=True, max_length=200)),
                ("language", models.CharField(choices=[("javascript", "JavaScript"), ("typescript", "TypeScript"), ("python", "Python"), ("markdown", "Markdown"), ("json", "JSON"), ("other", "Other")], db_index=True, max_length=30)),
                ("chunk_type", models.CharField(choices=[("function", "Function"), ("class", "Class"), ("module", "Module/File"), ("section", "Markdown Section"), ("config", "Configuration")], max_length=30)),
                ("symbol_name", models.CharField(blank=True, db_index=True, max_length=200)),
                ("content", models.TextField()),
                ("start_line", models.IntegerField(default=0)),
                ("end_line", models.IntegerField(default=0)),
                ("plugin", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="source_chunks", to="plugins.plugin")),
            ],
            managers=[
                ("objects", django.db.models.manager.Manager()),
                ("all_objects", django.db.models.manager.Manager()),
            ],
        ),
        migrations.AddIndex(
            model_name="sourcechunk",
            index=models.Index(fields=["plugin", "ref_library"], name="plugins_sou_plugin__b39ce0_idx"),
        ),
        migrations.AddIndex(
            model_name="sourcechunk",
            index=models.Index(fields=["plugin", "language"], name="plugins_sou_plugin__e5f4a7_idx"),
        ),
        migrations.AddIndex(
            model_name="sourcechunk",
            index=models.Index(fields=["ref_library", "symbol_name"], name="plugins_sou_ref_lib_a1c3d2_idx"),
        ),
        migrations.CreateModel(
            name="ReferenceDoc",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("slug", models.SlugField(max_length=200)),
                ("title", models.CharField(max_length=300)),
                ("content", models.TextField()),
                ("file_path", models.CharField(help_text="Path relative to plugin root", max_length=500)),
                ("doc_type", models.CharField(choices=[("reference", "Reference Doc"), ("knowledge", "Knowledge File"), ("skill", "Skill Definition"), ("readme", "README")], db_index=True, max_length=50)),
                ("plugin", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="references", to="plugins.plugin")),
            ],
            options={
                "unique_together": {("plugin", "file_path")},
            },
            managers=[
                ("objects", django.db.models.manager.Manager()),
                ("all_objects", django.db.models.manager.Manager()),
            ],
        ),
        migrations.AddIndex(
            model_name="referencedoc",
            index=models.Index(fields=["plugin", "doc_type"], name="plugins_ref_plugin__4d8e1f_idx"),
        ),
        migrations.CreateModel(
            name="AgentDefinition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("slug", models.SlugField(max_length=100)),
                ("name", models.CharField(max_length=200)),
                ("content", models.TextField()),
                ("plugin", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="agents", to="plugins.plugin")),
            ],
            options={
                "unique_together": {("plugin", "slug")},
            },
            managers=[
                ("objects", django.db.models.manager.Manager()),
                ("all_objects", django.db.models.manager.Manager()),
            ],
        ),
        migrations.AddIndex(
            model_name="agentdefinition",
            index=models.Index(fields=["plugin", "slug"], name="plugins_age_plugin__7f3b2c_idx"),
        ),
    ]
