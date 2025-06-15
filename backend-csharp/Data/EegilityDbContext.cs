using EegilityApi.Models;
using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;

namespace EegilityApi.Data;

public class EegilityDbContext : DbContext
{
    public EegilityDbContext(DbContextOptions<EegilityDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<EegData> EegData { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>()
            .ToCollection("users")
            .HasKey(u => u.Id);

        modelBuilder.Entity<User>()
            .Property(u => u.Email)
            .HasMaxLength(255);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Configure EegData entity
        modelBuilder.Entity<EegData>()
            .ToCollection("eegdata")
            .HasKey(e => e.Id);

        modelBuilder.Entity<EegData>()
            .Property(e => e.Filename)
            .HasMaxLength(255);

        modelBuilder.Entity<EegData>()
            .HasIndex(e => e.UserId);

        modelBuilder.Entity<EegData>()
            .HasIndex(e => e.UploadDate);

        modelBuilder.Entity<EegData>()
            .HasIndex(e => e.BidsCompliant);

        // Configure relationships
        modelBuilder.Entity<EegData>()
            .HasOne(e => e.User)
            .WithMany(u => u.EegDataRecords)
            .HasForeignKey(e => e.UserId);
    }
}