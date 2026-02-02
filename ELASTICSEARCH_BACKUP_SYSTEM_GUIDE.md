# Elasticsearch Backup System Guide

## Overview

This guide explains the Elasticsearch backup system for the Smart Tech B2C e-commerce platform. The backup system uses Elasticsearch snapshots to create point-in-time backups of your indices, enabling disaster recovery and data migration.

## Architecture

### Components

1. **Snapshot Repository** - A shared file system repository accessible by all Elasticsearch nodes
2. **Backup Scripts** - Automated scripts for repository setup and verification
3. **ILM Integration** - Index Lifecycle Management policies with automatic snapshot actions
4. **API Endpoints** - Admin routes for manual backup management

### Shared Volume

All Elasticsearch nodes share a common backup volume (`es_backups`) mounted at `/usr/share/elasticsearch/backups`. This ensures that:
- All nodes can access the same snapshot repository
- Snapshots are stored in a centralized location
- Repository verification works across all nodes

## Setup

### Prerequisites

1. Docker and Docker Compose installed
2. Elasticsearch cluster running (3 nodes)
3. Sufficient disk space for backups

### Initial Setup

1. **Start the cluster with backup volume:**

   ```bash
   docker-compose up -d
   ```

   The `docker-compose.yml` has been updated to include:
   - Shared backup volume `es_backups`
   - `path.repo` environment variable on all nodes
   - Backup directory mounted to all nodes

2. **Run the repository setup script:**

   ```bash
   node scripts/setup-elasticsearch-backup-repository.js
   ```

   This script:
   - Checks if the repository already exists
   - Creates a shared file system repository if needed
   - Verifies repository accessibility
   - Configures proper settings (compression, rate limits)

   Environment variables:
   - `ELASTICSEARCH_NODE` - Elasticsearch URL (default: `http://localhost:9200`)
   - `BACKUP_REPOSITORY_NAME` - Repository name (default: `smarttech_backups`)
   - `BACKUP_LOCATION` - Backup directory (default: `/usr/share/elasticsearch/backups`)
   - `VERIFY` - Verify repository after creation (default: `true`)

### Verification

Run the verification script to test the backup system:

```bash
node scripts/verify-elasticsearch-backup.js
```

This script:
- Verifies repository health
- Creates a test snapshot
- Lists existing snapshots
- Tests restore functionality
- Cleans up test snapshots

Environment variables:
- `ELASTICSEARCH_NODE` - Elasticsearch URL (default: `http://localhost:9200`)
- `BACKUP_REPOSITORY_NAME` - Repository name (default: `smarttech_backups`)
- `TEST_SNAPSHOT_NAME` - Test snapshot name (default: `verification-snapshot`)
- `TEST_INDICES` - Indices to include (default: creates test index)
- `SKIP_RESTORE` - Skip restore test (default: `false`)
- `SKIP_CLEANUP` - Skip cleanup of test snapshots (default: `false`)

## Usage

### Manual Backup via API

#### Create a Backup

```bash
curl -X POST http://localhost:3001/api/v1/admin/elasticsearch/backups/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "repository": "smarttech_backups",
    "snapshot": "manual-backup-2024-01-31",
    "indices": ["products", "categories", "brands"]
  }'
```

#### List Backups

```bash
curl -X GET http://localhost:3001/api/v1/admin/elasticsearch/backups \
  -H "Authorization: Bearer <your-token>"
```

#### Restore from Backup

```bash
curl -X POST http://localhost:3001/api/v1/admin/elasticsearch/backups/manual-backup-2024-01-31/restore \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "repository": "smarttech_backups"
  }'
```

### Using ILM Service

The ILM service has been updated with snapshot integration. You can use it programmatically:

```javascript
const { ILMService } = require('./backend/services/elasticsearch/ilm');
const { elasticsearchConfig } = require('./backend/config/elasticsearch');

const client = elasticsearchConfig.getClient();
const ilmService = new ILMService(client);

// Create a snapshot
await ilmService.createSnapshot('smarttech_backups', 'my-snapshot', ['products']);

// Get snapshot status
await ilmService.getSnapshotStatus('smarttech_backups', 'my-snapshot');

// List snapshots
await ilmService.listSnapshots('smarttech_backups');

// Restore from snapshot
await ilmService.restoreSnapshot('smarttech_backups', 'my-snapshot', ['products']);

// Delete a snapshot
await ilmService.deleteSnapshot('smarttech_backups', 'my-snapshot');

// Verify repository
await ilmService.verifyRepository('smarttech_backups');
```

### Automatic Backups via ILM

The ILM policies have been updated to automatically snapshot indices when they move to the cold phase:

- **Product indices**: Snapshot after 90 days
- **Category indices**: Snapshot after 180 days
- **Brand indices**: Snapshot after 180 days
- **Log indices**: No snapshot (deleted after 30 days)

Example ILM policy with snapshot:

```javascript
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "30d",
            "max_docs": 10000000
          }
        }
      },
      "warm": {
        "min_age": "30d",
        "actions": {
          "forcemerge": {
            "max_num_segments": 1
          },
          "shrink": {
            "number_of_shards": 1
          }
        }
      },
      "cold": {
        "min_age": "90d",
        "actions": {
          "freeze": {},
          "snapshot": {
            "repository": "smarttech_backups"
          }
        }
      },
      "delete": {
        "min_age": "365d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## Backup Repository Configuration

### Repository Settings

The backup repository is configured with the following settings:

- **Type**: `fs` (shared file system)
- **Location**: `/usr/share/elasticsearch/backups`
- **Compression**: `true` (snapshots are compressed)
- **Max snapshot rate**: `100mb/s`
- **Max restore rate**: `100mb/s`

### Security Considerations

- Snapshots are stored in a Docker volume that persists across container restarts
- The backup directory should be backed up to external storage for disaster recovery
- Consider implementing snapshot lifecycle policies to manage retention

## Troubleshooting

### Repository Not Found

If you get a "repository not found" error:

1. Verify the repository exists:
   ```bash
   node scripts/setup-elasticsearch-backup-repository.js
   ```

2. Check Docker logs for Elasticsearch nodes:
   ```bash
   docker logs smarttech_es_node1
   ```

3. Verify the backup volume is mounted:
   ```bash
   docker exec smarttech_es_node1 ls -la /usr/share/elasticsearch/backups
   ```

### Permission Errors

If you encounter permission errors:

1. Check volume permissions:
   ```bash
   docker volume inspect elasticsearch_es_backups
   ```

2. Ensure the Elasticsearch container has write access:
   ```bash
   docker exec smarttech_es_node1 touch /usr/share/elasticsearch/backups/test
   ```

3. If needed, recreate the volume with proper permissions:
   ```bash
   docker-compose down
   docker volume rm elasticsearch_es_backups
   docker-compose up -d
   ```

### Snapshot Creation Failed

If snapshot creation fails:

1. Check cluster health:
   ```bash
   curl http://localhost:9200/_cluster/health
   ```

2. Verify repository health:
   ```bash
   node scripts/verify-elasticsearch-backup.js
   ```

3. Check available disk space:
   ```bash
   docker exec smarttech_es_node1 df -h /usr/share/elasticsearch/backups
   ```

### Restore Failed

If restore fails:

1. Ensure the snapshot exists:
   ```bash
   curl -X GET "http://localhost:9200/_snapshot/smarttech_backups/*"
   ```

2. Check if indices already exist (restore will fail if indices exist):
   ```bash
   curl -X GET "http://localhost:9200/_cat/indices?v"
   ```

3. Use the `rename_pattern` and `rename_replacement` options to avoid conflicts:
   ```bash
   curl -X POST "http://localhost:9200/_snapshot/smarttech_backups/my-snapshot/_restore" \
     -H "Content-Type: application/json" \
     -d '{
       "indices": "products",
       "rename_pattern": "(.+)",
       "rename_replacement": "restored_$1"
     }'
   ```

## Best Practices

### Backup Schedule

1. **Daily snapshots** for critical indices (products, orders)
2. **Weekly snapshots** for less critical indices (categories, brands)
3. **Monthly snapshots** for historical data
4. **Before major changes** (schema updates, bulk imports)

### Snapshot Retention

1. Keep daily snapshots for 30 days
2. Keep weekly snapshots for 12 weeks
3. Keep monthly snapshots for 12 months
4. Archive older snapshots to external storage

### Monitoring

1. Monitor snapshot creation times
2. Track snapshot sizes
3. Set up alerts for failed snapshots
4. Regularly verify repository health

### Testing

1. Run the verification script weekly
2. Test restore procedures monthly
3. Document restore procedures
4. Train team on disaster recovery

## API Reference

### Backup Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/admin/elasticsearch/backups` | List all backup repositories |
| POST | `/api/v1/admin/elasticsearch/backups/create` | Create a new snapshot |
| POST | `/api/v1/admin/elasticsearch/backups/:id/restore` | Restore from a snapshot |

### ILM Service Methods

| Method | Description |
|--------|-------------|
| `createSnapshot(repository, snapshot, indices)` | Create a snapshot |
| `getSnapshotStatus(repository, snapshot)` | Get snapshot status |
| `listSnapshots(repository)` | List all snapshots |
| `deleteSnapshot(repository, snapshot)` | Delete a snapshot |
| `restoreSnapshot(repository, snapshot, indices)` | Restore from snapshot |
| `verifyRepository(repository)` | Verify repository health |

## Files

| File | Description |
|------|-------------|
| `scripts/setup-elasticsearch-backup-repository.js` | Repository setup script |
| `scripts/verify-elasticsearch-backup.js` | Backup verification script |
| `backend/services/elasticsearch/ilm.js` | ILM service with snapshot integration |
| `backend/routes/admin/elasticsearch.js` | Admin backup endpoints |
| `docker-compose.yml` | Docker configuration with backup volume |

## Additional Resources

- [Elasticsearch Snapshot and Restore](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshots-take-snapshot.html)
- [Elasticsearch ILM](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html)
- [Shared File System Repository](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-snapshots.html#_shared_file_system_repository)
