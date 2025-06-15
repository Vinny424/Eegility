using EegilityApi.Models;
using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;

namespace EegilityApi.Data;

public class BidsDbContext : DbContext
{
    public BidsDbContext(DbContextOptions<BidsDbContext> options) : base(options) { }

    public DbSet<BidsDataset> BidsDatasets { get; set; }
    public DbSet<BidsSubject> BidsSubjects { get; set; }
    public DbSet<BidsSession> BidsSessions { get; set; }
    public DbSet<BidsEegRecording> BidsEegRecordings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure BidsDataset entity
        modelBuilder.Entity<BidsDataset>()
            .ToCollection("bids_datasets")
            .HasKey(d => d.Id);

        modelBuilder.Entity<BidsDataset>()
            .Property(d => d.Name)
            .HasMaxLength(255);

        modelBuilder.Entity<BidsDataset>()
            .HasIndex(d => d.Name);

        modelBuilder.Entity<BidsDataset>()
            .HasIndex(d => d.CreatedBy);

        // Configure BidsSubject entity
        modelBuilder.Entity<BidsSubject>()
            .ToCollection("bids_subjects")
            .HasKey(s => s.Id);

        modelBuilder.Entity<BidsSubject>()
            .Property(s => s.SubjectId)
            .HasMaxLength(100);

        modelBuilder.Entity<BidsSubject>()
            .HasIndex(s => new { s.DatasetId, s.SubjectId })
            .IsUnique();

        modelBuilder.Entity<BidsSubject>()
            .HasIndex(s => s.DatasetId);

        // Configure BidsSession entity
        modelBuilder.Entity<BidsSession>()
            .ToCollection("bids_sessions")
            .HasKey(s => s.Id);

        modelBuilder.Entity<BidsSession>()
            .Property(s => s.SessionId)
            .HasMaxLength(100);

        modelBuilder.Entity<BidsSession>()
            .HasIndex(s => new { s.SubjectId, s.SessionId })
            .IsUnique();

        modelBuilder.Entity<BidsSession>()
            .HasIndex(s => s.SubjectId);

        modelBuilder.Entity<BidsSession>()
            .HasIndex(s => s.SessionDate);

        // Configure BidsEegRecording entity
        modelBuilder.Entity<BidsEegRecording>()
            .ToCollection("bids_eeg_recordings")
            .HasKey(r => r.Id);

        modelBuilder.Entity<BidsEegRecording>()
            .Property(r => r.BidsFilename)
            .HasMaxLength(500);

        modelBuilder.Entity<BidsEegRecording>()
            .HasIndex(r => r.SessionId);

        modelBuilder.Entity<BidsEegRecording>()
            .HasIndex(r => r.UserId);

        modelBuilder.Entity<BidsEegRecording>()
            .HasIndex(r => r.Task);

        modelBuilder.Entity<BidsEegRecording>()
            .HasIndex(r => r.UploadDate);

        modelBuilder.Entity<BidsEegRecording>()
            .HasIndex(r => new { r.SessionId, r.Task, r.Run })
            .IsUnique();

        // Configure relationships
        modelBuilder.Entity<BidsSubject>()
            .HasOne(s => s.Dataset)
            .WithMany(d => d.Subjects)
            .HasForeignKey(s => s.DatasetId);

        modelBuilder.Entity<BidsSession>()
            .HasOne(s => s.Subject)
            .WithMany(sub => sub.Sessions)
            .HasForeignKey(s => s.SubjectId);

        modelBuilder.Entity<BidsEegRecording>()
            .HasOne(r => r.Session)
            .WithMany(s => s.EegRecordings)
            .HasForeignKey(r => r.SessionId);

        modelBuilder.Entity<BidsEegRecording>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId);
    }
}